type Container<T> = T | T[]
type RecursiveContainer<T> = T | RecursiveArray<T>
interface RecursiveArray<T> extends Array<RecursiveContainer<T>> {}

declare namespace JsonLd {
	export type Graph = Container<Node>

	export type Node = {
		"@id"?: string
		"@type"?: Container<string>
		"@index"?: string
		"@graph"?: Graph
		"@context"?: Context
	} & Properties

	interface Properties {
		[property: string]: RecursiveContainer<Value<Node>>
	}

	// This is made generic so that JsonLd.Flattened.Node
	// can reuse Value<{"@id": string}>.
	type Value<T> =
		| { "@index"?: string; "@list": Container<Value<T>> }
		| { "@index"?: string; "@set": Container<Value<T>> }
		| Primitive
		| ValueObject<Primitive>
		| LanguageValue
		| TypedValue
		| T

	type Primitive = number | boolean | string

	interface ValueObject<T> {
		"@value": T
	}

	interface LanguageValue extends ValueObject<string> {
		"@language": string
	}

	interface TypedValue extends ValueObject<string> {
		"@type": string
	}

	// Expanded document form
	// https://www.w3.org/TR/json-ld-api/#expansion-algorithms
	export namespace Expanded {
		export type Graph = Node[]

		export type Node = {
			"@id"?: string
			"@index"?: string
			"@type?": string[]
			"@graph"?: Node[]
		} & Properties

		interface Properties {
			[property: string]: Value[]
		}

		type Value =
			| { "@index"?: string; "@list": Array<Value> }
			| { "@index"?: string; "@set": Array<Value> }
			| ValueObject<Primitive>
			| LanguageValue
			| TypedValue
			| Node
	}

	// Flattened document form:
	// https://www.w3.org/TR/json-ld-api/#flattening-algorithms
	export namespace Flattened {
		export type Graph =
			| Node[]
			| {
					"@context": Context
					"@graph": Node[]
			  }

		export type Node = {
			"@id": string
			"@type"?: Container<string>
			"@index"?: string
			"@graph"?: Node[]
		} & {
			[property: string]: RecursiveContainer<Value<{ "@id": string }>>
		}
	}

	export namespace FlattenedExpanded {
		export type Graph = Node[]

		export type Node = {
			"@id": string
			"@type"?: string[]
			"@index"?: string
			"@graph"?: Node[]
		} & Properties

		interface Properties {
			[property: string]: Value[]
		}

		type Value =
			| { "@index"?: string; "@list": Array<Value> }
			| { "@index"?: string; "@set": Array<Value> }
			| ValueObject<Primitive>
			| LanguageValue
			| TypedValue
			| { "@id": string }
	}

	// Contexts
	export type Context = Container<string | ContextObject>

	type ContextObject = {
		"@base"?: string
		"@vocab"?: string
		"@version"?: number
	} & {
		[property: string]: string | ContextValue
	}

	interface ContextValue {
		"@id"?: string
		"@type"?: string
		"@prefix"?: boolean
		"@reverse"?: string
		"@container"?: Container<string>
		"@protected"?: boolean
		"@context"?: Context
	}
}

declare module "jsonld" {
	let documentLoader: DocumentLoader

	interface DocumentResult {
		contextUrl?: string
		documentUrl?: string
		document: JsonLd.Graph
	}
	export type DocumentLoader =
		| ((
				url: string,
				callback: (err: Error, result: DocumentResult) => void
		  ) => void)
		| ((url: string) => Promise<DocumentResult>)

	export function compact(
		doc: JsonLd.Graph | string,
		context: JsonLd.Context,
		callback: (err: Error, compacted: JsonLd.Graph) => void
	): void

	export function compact(
		doc: JsonLd.Graph | string,
		context: JsonLd.Context
	): Promise<JsonLd.Graph>

	export function expand(
		doc: JsonLd.Graph | string,
		callback: (err: Error, expanded: JsonLd.Expanded.Graph) => void
	): void

	export function expand(
		doc: JsonLd.Flattened.Graph | string,
		callback: (err: Error, expanded: JsonLd.FlattenedExpanded.Graph) => void
	): void

	export function expand(
		doc: JsonLd.Graph | string
	): Promise<JsonLd.Expanded.Graph>

	export function expand(
		doc: JsonLd.Flattened.Graph
	): Promise<JsonLd.FlattenedExpanded.Graph>

	export function flatten(
		doc: JsonLd.Graph | string,
		context: JsonLd.Context,
		callback: (err: Error, flattened: JsonLd.Flattened.Graph) => void
	): void

	export function flatten(
		doc: JsonLd.Graph | string,
		context: null,
		callback: (err: Error, flattened: JsonLd.FlattenedExpanded.Graph) => void
	): void

	export function flatten(
		doc: JsonLd.Graph | string,
		context: JsonLd.Context
	): Promise<JsonLd.Flattened.Graph>

	export function flatten(
		doc: JsonLd.Graph | string,
		context: null
	): Promise<JsonLd.FlattenedExpanded.Graph>

	export function frame(
		doc: JsonLd.Graph | string,
		frame: JsonLd.Graph,
		callback: (err: Error, framed: JsonLd.Graph) => void
	): void

	export function frame(
		doc: JsonLd.Graph | string,
		frame: JsonLd.Graph
	): Promise<JsonLd.Graph>

	export function canonize(
		doc: JsonLd.Graph | string,
		options: { algorithm: string; format: string },
		callback: (err: Error, canonized: string) => void
	): void

	export function canonize(
		doc: JsonLd.Graph | string,
		options: { algorithm: string; format: string }
	): Promise<string>

	export function toRDF(
		doc: JsonLd.Graph | string,
		options: { format: string },
		callback: (err: Error, nquads: string) => void
	): void

	export function toRDF(
		doc: JsonLd.Graph | string,
		options: { format: string }
	): Promise<string>

	export function fromRDF(
		nquads: string,
		options: { format: string },
		callback: (err: Error, doc: JsonLd.Graph) => void
	): void

	export function fromRDF(
		nquads: string,
		options: { format: string }
	): Promise<JsonLd.Graph>

	export function registerRDFParser(
		contentType: string,
		parser:
			| ((input: any, callback: (err: Error, dataset: {}) => void) => void)
			| ((input: any) => Promise<{}>)
			| ((input: any) => {})
	): void
}
