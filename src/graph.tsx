/// <reference path="jsonld.d.ts" />

import React from "react"
import { List, Map, Set } from "immutable"

import Catalog from "./catalog"
import { CLASS, THING, LABEL, SUBCLASS, PROPERTY } from "./schema/constants"
import { nodes, domainMap, searchAncestry, enumerateAncestry } from "./schema"
import Identity from "./identity"

interface GraphProps {
	graph: JsonLd.FlattenedExpanded.Graph
}

interface GraphState {
	types: List<string>
	properties: List<string>
	values: Map<string, List<List<string>>>
}

export default class Graph extends React.Component<GraphProps, GraphState> {
	static enumerateProperties(types: List<string>): List<string> {
		const rootSet: Set<string> = Set()
		const properties = types.reduce(
			(roots, type) =>
				enumerateAncestry(type, SUBCLASS).reduce(
					(roots, type) => roots.union(Set(domainMap[type])),
					roots
				),
			rootSet
		)
		return List(properties)
	}

	constructor(props: GraphProps) {
		super(props)
		this.state = {
			types: List(),
			properties: List(),
			values: Map(),
		}
	}

	handlePropertySelect = (id: string) => {
		console.log("selected property", id)
	}

	handleClassSelect = (id: string) => {
		this.setState(state => {
			if (state.types.some(type => searchAncestry(type, id, SUBCLASS))) {
				return null
			} else {
				const types = state.types
					.filterNot(type => searchAncestry(id, type, SUBCLASS))
					.push(id)
				const properties = Graph.enumerateProperties(types)
				return { types, properties }
			}
		})
	}

	handleClose = (index: number) => {
		this.setState(state => {
			const types = state.types.delete(index)
			const properties = Graph.enumerateProperties(types)
			return { types, properties }
		})
	}

	render() {
		const { graph } = this.props
		return (
			<section className="graph">
				<h1>This is a graph</h1>
				<Identity autoFocus={true} universe={List()} />
				<Catalog
					placeholder="Set type classes"
					roots={List([THING])}
					catalog={CLASS}
					autoFocus={false}
					onSelect={this.handleClassSelect}
				>
					<div className="types">{this.state.types.map(this.renderType)}</div>
				</Catalog>
				{this.renderProperties()}
				{this.renderValues()}
				<pre> {JSON.stringify(graph, null, 2)}</pre>
			</section>
		)
	}

	renderType = (id: string, index: number) => {
		return (
			<div key={index} className="type">
				<div className="label">{nodes[id][LABEL]}</div>
				<div className="close noselect" onClick={_ => this.handleClose(index)}>
					╳
				</div>
			</div>
		)
	}

	renderProperties() {
		if (this.state.types.size === 0) {
			return null
		}

		return (
			<Catalog
				placeholder="Set property values"
				roots={this.state.properties}
				catalog={PROPERTY}
				autoFocus={false}
				onSelect={this.handlePropertySelect}
			/>
		)
	}

	renderValues() {
		return (
			<table>
				<tbody>{this.state.values.map((value, property) => {})}</tbody>
			</table>
		)
	}
}
