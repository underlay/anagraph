/// <reference path="jsonld.d.ts" />

import React from "react"
import { List } from "immutable"

import Catalog from "./catalog"
import { CLASS, THING, LABEL } from "./schema/constants"
import { nodes } from "./schema"
import Identity from "./identity"

interface GraphProps {
	graph: JsonLd.FlattenedExpanded.Graph
}

interface GraphState {
	types: List<string>
}

export default class Graph extends React.Component<GraphProps, GraphState> {
	constructor(props: GraphProps) {
		super(props)
		this.state = {
			types: List(),
		}
	}

	handleSelect = (id: string) => {
		this.setState(state => {
			if (state.types.includes(id)) {
				return null
			} else {
				return { types: state.types.push(id) }
			}
		})
	}

	render() {
		const { graph } = this.props
		return (
			<section className="graph">
				<h1>This is a graph</h1>
				<Identity autoFocus={true} universe={List()} />
				<Catalog
					roots={List([THING])}
					filters={this.state.types}
					catalog={CLASS}
					autoFocus={false}
					onSelect={this.handleSelect}
				>
					<div>{this.state.types.interpose(", ").map(this.renderType)}</div>
				</Catalog>
				<pre>{JSON.stringify(graph, null, 2)}</pre>
			</section>
		)
	}

	renderType = (type: string, index: number) => {
		const className = []
		let textContent = ", "
		if (index % 2 === 0) {
			className.push("type")
			textContent = nodes[type][LABEL]
		}
		return (
			<span key={index} className={className.join("")}>
				{textContent}
			</span>
		)
	}
}
