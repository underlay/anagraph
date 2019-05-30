import {
	TYPE,
	ID,
	GRAPH,
	SUBCLASS,
	PROPERTY,
	SUBPROPERTY,
	ENUMERATION,
	THING,
	DOMAIN,
	CLASS,
} from "./constants"

import { Container, SchemaGraph, SchemaNode, Parent } from "./schema"

import SchemaJson from "./schema.json"

// schema is the raw JSON object
const schema: SchemaGraph = SchemaJson
	; (window as any).schema = schema

export function wrap<T>(container: Container<T> | undefined): Array<T> {
	if (Array.isArray(container)) {
		return container
	} else if (container !== undefined) {
		return [container]
	} else {
		return []
	}
}

// nodes is an id-indexed object
export const nodes: { [id: string]: SchemaNode } = {}
	; (window as any).nodes = nodes

schema[GRAPH].forEach(node => (nodes[node[ID]] = node))

export const classes: Set<string> = new Set([THING])
	; (window as any).classes = classes

function traverseClasses(node: SchemaNode): boolean {
	if (classes.has(node[ID])) {
		return true
	}
	let isClass = false
	wrap(node[SUBCLASS]).forEach(({ [ID]: subclass }) => {
		if (classes.has(subclass)) {
			classes.add(node[ID])
			isClass = true
		} else if (nodes.hasOwnProperty(subclass)) {
			if (traverseClasses(nodes[subclass])) {
				classes.add(node[ID])
				isClass = true
			}
		}
	})
	return isClass
}

export function searchAncestry(
	type: string,
	target: string,
	parent: Parent
): boolean {
	if (type === target) {
		return true
	} else if (nodes[type]) {
		return wrap(nodes[type][parent]).some(({ [ID]: id }) =>
			searchAncestry(id, target, parent)
		)
	} else {
		return false
	}
}

function traverseAncestry(type: string, parent: Parent, ancestry: string[]) {
	ancestry.push(type)
	if (nodes[type]) {
		wrap(nodes[type][parent]).forEach(({ [ID]: id }) =>
			traverseAncestry(id, parent, ancestry)
		)
	}
}

export function enumerateAncestry(type: string, parent: Parent): string[] {
	const ancestry: string[] = []
	traverseAncestry(type, parent, ancestry)
	return ancestry
}

export type Tree = { [id: string]: Set<string> }

export const classTree: Tree = {}
	; (window as any).classTree = classTree
export const propertyTree: Tree = {}
	; (window as any).propertyTree = propertyTree

export const trees = {
	[CLASS]: classTree,
	[PROPERTY]: propertyTree,
}

export const roots = {
	[CLASS]: [],
	[PROPERTY]: [THING],
}

export const enumerations: { [type: string]: Set<string> } = {}
	; (window as any).enumerations = enumerations

// domainMap is a map from class ids to an array of property ids
export const domainMap: { [id: string]: string[] } = {}
	; (window as any).domainMap = domainMap

function get(tree: Tree, id: string): Set<string> {
	if (tree.hasOwnProperty(id)) {
		return tree[id]
	} else {
		return (tree[id] = new Set([]))
	}
}

function traverse(id: string, tree: Tree, parent: Parent) {
	get(tree, id)
	wrap(nodes[id][parent]).forEach(node => get(tree, node[ID]).add(id))
}

schema[GRAPH].forEach(node => {
	const { [ID]: id } = node

	if (id !== ENUMERATION && searchAncestry(id, ENUMERATION, SUBCLASS)) {
		enumerations[id] = new Set([])
	} else if (node[TYPE] === PROPERTY) {
		traverse(id, propertyTree, SUBPROPERTY)
		wrap(node[DOMAIN]).forEach(({ [ID]: domain }) => {
			if (domainMap.hasOwnProperty(domain)) {
				domainMap[domain].push(id)
			} else {
				domainMap[domain] = [id]
			}
		})
	} else if (traverseClasses(node)) {
		traverse(id, classTree, SUBCLASS)
	}
})

schema[GRAPH].forEach(node => {
	const { [ID]: id, [TYPE]: type } = node
	wrap(type).forEach(type => {
		if (enumerations.hasOwnProperty(type)) {
			enumerations[type].add(id)
		}
	})
})
