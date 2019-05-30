/// <reference path="jsonld.d.ts" />

import React from "react"
import { List, Set } from "immutable"

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
}

export default class Graph extends React.Component<GraphProps, GraphState> {

	constructor(props: GraphProps) {
		super(props)
		this.state = {
			types: List(),
			properties: List(),
		}
	}

	handlePropertySelect = (id: string) => {
		console.log("selected property", id)
	}

	handleClassSelect = (id: string) => {
		console.log("handling select", id)
		this.setState(state => {
			if (state.types.some(type => searchAncestry(type, id, SUBCLASS))) {
				return null
			} else {
				const types = state.types.filterNot(type => searchAncestry(id, type, SUBCLASS))
				return { types: types.push(id) }
			}
		})
	}

	handleClose = (index: number) => {
		this.setState(state => ({ types: state.types.delete(index) }))
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
				<pre>{JSON.stringify(graph, null, 2)}</pre>
			</section>
		)
	}

	renderType = (id: string, index: number) => {
		return (
			<div key={index} className="type">
				<div className="label">{nodes[id][LABEL]}</div>
				<div className="close noselect" onClick={_ => this.handleClose(index)}>╳</div>
			</div>
		)
	}

	renderProperties() {
		if (this.state.types.size === 0) {
			return null
		}

		const rootSet: Set<string> = Set()
		const roots = this.state.types.reduce(
			(roots, type) =>
				enumerateAncestry(type, SUBCLASS).reduce(
					(roots, type) => roots.union(Set(domainMap[type])),
					roots
				),
			rootSet
		)

		return <Catalog
			placeholder="Set property values"
			roots={List(roots)}
			catalog={PROPERTY}
			autoFocus={false}
			onSelect={this.handlePropertySelect}
		/>
	}
}
