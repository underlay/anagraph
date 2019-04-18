import {
	ID,
	TYPE,
	GRAPH,
	CONTEXT,
	COMMENT,
	LABEL,
	CLASS,
	SUBCLASS,
	RANGE,
	DOMAIN,
	SUPERCEDED,
	SOURCE,
	EQUIVALENT_CLASS,
	EQUIVALENT_PROPERTY,
	INVERSE,
	SAME,
	CATEGORY,
	SUBPROPERTY,
	PROPERTY,
} from "./constants"

export type CatalogType = typeof CLASS | typeof PROPERTY
export type Parent = typeof SUBPROPERTY | typeof SUBCLASS

export type Container<T> = T | Array<T>

interface ID {
	[ID]: string
}

export interface SchemaGraph extends ID {
	[CONTEXT]: { [prefix: string]: string }
	[GRAPH]: SchemaNode[]
}

/*
interface SchemaBase extends ID {
	[TYPE]: Container<string>

	[COMMENT]: string
	[LABEL]: string

	[SUPERCEDED]?: ID
	[SOURCE]?: Container<ID> // both classes and properties
	[SAME]?: ID // only on enumerations of the days of the week
	[CATEGORY]?: string // both classes and properties
}

export interface SchemaProperty extends SchemaBase {
	[TYPE]: typeof PROPERTY
	[DOMAIN]: Container<ID>
	[RANGE]: Container<ID>
	[INVERSE]?: ID // only on properties
	[SUBPROPERTY]?: ID
	[EQUIVALENT_PROPERTY]?: ID
}

export interface SchemaClass extends SchemaBase {
	[EQUIVALENT_CLASS]?: Container<ID> // only classes
	[SUBCLASS]?: Container<ID>
}

export type SchemaNode = SchemaClass | SchemaProperty
*/

export interface SchemaNode extends ID {
	[TYPE]: Container<string>

	[COMMENT]: string
	[LABEL]: string

	[DOMAIN]?: Container<ID>
	[RANGE]?: Container<ID>

	[SUPERCEDED]?: ID
	[SUBCLASS]?: Container<ID>
	[SOURCE]?: Container<ID>
	[EQUIVALENT_PROPERTY]?: ID
	[SUBPROPERTY]?: ID
	[EQUIVALENT_CLASS]?: Container<ID>
	[INVERSE]?: ID
	[SAME]?: ID
	[CATEGORY]?: string
}
