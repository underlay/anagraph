/// <reference path="jsonld.d.ts" />

import React from "react"

import Catalog from "./catalog"
import { CLASS, THING } from "./schema/constants"
import { List } from "immutable"

export default function({ graph }: { graph: JsonLd.FlattenedExpanded.Graph }) {
	return (
		<section>
			<h1>This is a graph</h1>
			<Catalog
				roots={List([THING])}
				catalog={CLASS}
				autoFocus={true}
				onSelect={id => console.log(id)}
			/>
			<pre>{JSON.stringify(graph, null, 2)}</pre>
		</section>
	)
}
