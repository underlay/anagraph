import React from "react"
import { List, Set } from "immutable"

import Fuse from "fuse.js"

import { CatalogType } from "./schema/schema"
import { nodes, trees, Tree } from "./schema/index"
import { THING, LABEL, COMMENT } from "./schema/constants"

interface CatalogProps {
	placeholder: string
	catalog: CatalogType
	roots: List<string>
	autoFocus: boolean
	// onFocus: () => void
	onSelect: (id: string) => void
}

interface CatalogState {
	open: boolean
	value: string
	focus: number
	mouse: boolean
	entries: List<List<string>>
}

export default class Catalog extends React.Component<
	CatalogProps,
	CatalogState
	> {
	private fuse: any
	static Spacing = 2

	static MaxResults = 10
	static FuseOptions = {
		id: "id",
		shouldSort: true,
		location: 0,
		threshold: 0.3,
		keys: [{ name: "label", weight: 0.8 }, { name: "comment", weight: 0.2 }],
	}

	static expandRoot(
		state: Readonly<CatalogState>,
		props: Readonly<CatalogProps>
	): Pick<CatalogState, never> | null {
		const { focus, entries } = state
		const entry = entries.get(focus)
		const id = entry === undefined ? undefined : entry.last(undefined)
		if (
			id !== undefined &&
			entry !== undefined &&
			entries.get(focus + 1, entry).size <= entry.size
		) {
			const children = trees[props.catalog][id]
			if (children.size > 0) {
				const args: [number, number, ...List<string>[]] = [focus + 1, 0]
				children.forEach(child => args.push(entry.push(child)))
				return {
					entries: entries.splice.apply(entries, args),
					focus: focus + 1,
				}
			}
		}
		return null
	}

	static collapseRoot(
		state: Readonly<CatalogState>
	): Pick<CatalogState, never> | null {
		const { focus, entries } = state
		const entry = entries.get(focus)
		if (entry !== undefined && entry.size > 1) {
			const size = entry.size - 1
			let previous = 0
			for (let i = focus; i--; i >= 0) {
				const e = entries.get(i, null)
				if (e !== null && e.size <= size) {
					previous = i + 1
					break
				}
			}
			let next = entries.size
			for (let i = focus + 1; i < entries.size; i++) {
				const e = entries.get(i, null)
				if (e !== null && e.size <= size) {
					next = i
					break
				}
			}
			return {
				entries: entries.splice(previous, next - previous),
				focus: previous - 1,
			}
		}
		return null
	}

	static enumerate(roots: List<string>, set: Set<string>, tree: Tree): Set<string> {
		return roots.reduce((set: Set<string>, root: string) => Catalog.enumerate(List(tree[root]), set.add(root), tree), set)
	}

	constructor(props: CatalogProps) {
		super(props)
		const state = {
			open: props.autoFocus,
			value: "",
			focus: 0,
			mouse: false,
			entries: props.roots.map(root => List([root])),
		}

		const ids = Catalog.enumerate(props.roots, Set(), trees[props.catalog])
		const records = ids.map(id => ({ id, label: nodes[id][LABEL], comment: nodes[id][COMMENT] }))
		this.fuse = new Fuse(records.toArray(), Catalog.FuseOptions)

		this.tree = null
		this.scroll = null

		this.state = { ...state, ...Catalog.expandRoot(state, props), focus: 0 }
	}

	private tree: null | HTMLDivElement
	private scroll: null | HTMLDivElement

	componentDidUpdate(_: CatalogProps, state: CatalogState) {
		if (
			!this.state.mouse &&
			state.focus !== this.state.focus &&
			this.tree !== null &&
			this.scroll !== null
		) {
			const top = this.tree.scrollTop
			const bot = top + this.tree.offsetHeight
			const div = this.scroll.offsetHeight / this.state.entries.size
			const margin = 2 * div
			const current = div * this.state.focus
			if (current < top + margin) {
				this.tree.scrollTop = Math.max(0, current - margin)
			} else if (current + div + margin > bot) {
				this.tree.scrollTop =
					Math.min(this.tree.scrollHeight, current + div + margin) -
					this.tree.offsetHeight
			}
		}
	}

	handleSelect = (id: string) => {
		this.setState(
			{ open: false, value: "", focus: 0, entries: this.props.roots.map(root => List([root])) },
			() => this.props.onSelect(id)
		)
	}

	handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		const { value } = event.target
		if (value === "") {
			this.setState({ focus: 0, value, entries: this.props.roots.map(root => List([root])), })
		} else {
			const records: string[] = this.fuse.search(value).slice(0, Catalog.MaxResults)
			this.setState({ focus: 0, value, entries: List(records).map(record => List([record])) })
		}
	}

	handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
		if (event.keyCode > 36 && event.keyCode < 41) {
			event.preventDefault()
			if (event.keyCode === 37) {
				// left
				this.setState(Catalog.collapseRoot)
			} else if (event.keyCode === 38) {
				// up
				this.setState(state => {
					const size = state.entries.size
					const focus = (state.focus + size - 1) % size
					return { focus, mouse: false }
				})
			} else if (event.keyCode === 39) {
				// right
				this.setState(Catalog.expandRoot)
			} else if (event.keyCode === 40) {
				// down
				this.setState(state => {
					const size = state.entries.size
					const focus = (state.focus + 1) % size
					return { focus, mouse: false }
				})
			}
		} else if (event.keyCode === 27) {
			// escape
			event.currentTarget.blur()
			this.setState(state => (state.open ? { open: false } : null))
		} else if (event.keyCode === 13) {
			// enter
			event.preventDefault()
			const { entries, focus } = this.state
			const entry = entries.get(focus, null)
			if (entry !== null) {
				const id = entry.last(null)
				if (id !== null) {
					event.currentTarget.blur()
					this.handleSelect(id)
				}
			}
		}
	}

	handleFocus = (_: React.FocusEvent<HTMLInputElement>) => {
		this.setState(state => (state.open ? null : { open: true }))
	}

	render() {
		const { autoFocus, children, placeholder } = this.props
		const { open, value } = this.state
		return (
			<div className="catalog">
				<div className="search">
					<input
						type="text"
						placeholder={placeholder}
						autoFocus={autoFocus}
						value={value}
						onKeyDown={this.handleKeyDown}
						onChange={this.handleChange}
						onFocus={this.handleFocus}
					/>
					{children}
				</div>
				{open ? (
					<div className="content">
						{this.renderTree()}
						{this.renderDescription()}
					</div>
				) : null}
			</div>
		)
	}

	renderTree() {
		const { entries, focus } = this.state
		const tree = trees[this.props.catalog]
		return (
			<div className="tree" ref={div => (this.tree = div)}>
				<div className="scroll" ref={div => (this.scroll = div)}>
					{entries.map((entry, index) => {
						const expanded = entries.get(index + 1, entry).size > entry.size
						const focused = index === focus
						return this.renderEntry(entry, index, expanded, focused, tree)
					})}
				</div>
			</div>
		)
	}

	renderEntry(
		entry: List<string>,
		index: number,
		expanded: boolean,
		focused: boolean,
		tree: Tree
	) {
		const id = entry.last(undefined)
		if (id !== undefined) {
			const className = ["entry", "noselect"]

			if (focused) {
				className.push("focused")
			}

			if (tree[id].size === 0) {
				className.push("empty")
			} else if (expanded) {
				className.push("expanded")
			} else {
				className.push("collapsed")
			}

			const prefix = " ".repeat((entry.size - 1) * Catalog.Spacing)

			return (
				<div
					key={index}
					className={className.join(" ")}
					onMouseEnter={_ => this.setState({ focus: index, mouse: true })}
				>
					<span className="prefix" onClick={_ => {
						if (tree[id].size > 0) {
							if (expanded) {
								this.setState(state => {
									const clone = Object.assign({}, state)
									const increment = Object.assign(clone, { focus: state.focus + 1 })
									return Catalog.collapseRoot(increment)
								})
							} else {
								this.setState(state => Object.assign(Catalog.expandRoot(state, this.props), { focus: state.focus }))
							}
						}
					}}>{prefix}</span>
					<span className="label" onClick={_ => this.handleSelect(id)}>{nodes[id][LABEL]}</span>
				</div>
			)
		}
		return null
	}

	renderDescription() {
		const { entries, focus } = this.state
		const entry = entries.get(focus, null)
		if (entry !== null) {
			const id = entry.last(THING)
			const { [LABEL]: label, [COMMENT]: __html } = nodes[id]
			return (
				<div className="documentation">
					<h1>{label}</h1>
					<div>
						<hr />
					</div>
					<div className="description" dangerouslySetInnerHTML={{ __html }} />
				</div>
			)
		}
		return null
	}
}
