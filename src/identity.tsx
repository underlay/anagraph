import React from "react"
import { List } from "immutable"

interface IdentityProps {
	autoFocus: boolean
	universe: List<List<string>> // [id: string, ...type: string[]][]
}

interface IdentityState {
	open: boolean
	value: string
	focus: number
	results: List<List<string>> // the empty list is the "create blank node" option
}

export default class Identity extends React.Component<
	IdentityProps,
	IdentityState
> {
	static Placeholder = "Search for an existing object, or create a new one"
	static Query = "q"
	static sanitizeId = (id: string) =>
		id.replace(/[^a-zA-Z0-9]/g, "-").replace(/-{2,}/, "-")

	static OpenRefineRoot =
		"https://tools.wmflabs.org/openrefine-wikidata/en/api?queries="

	static async OpenRefine(
		query: string
	): Promise<List<List<{ name: string; id: string }>>> {
		const search = JSON.stringify({ [Identity.Query]: { query, limit: 5 } })
		const url = Identity.OpenRefineRoot + encodeURIComponent(search)
		const res = await fetch(url)
		const {
			[Identity.Query]: { result },
		} = await res.json()
		return List(
			result.map(
				({
					name,
					id,
					type,
				}: {
					name: string
					id: string
					type: { name: string; id: string }[]
				}) => List([{ name, id }, ...type])
			)
		)
	}

	constructor(props: IdentityProps) {
		super(props)
		this.state = {
			value: "",
			open: props.autoFocus,
			focus: 0,
			results: List([List([])]),
		}
	}

	handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		this.setState({ value: event.target.value })
	}

	handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
		if (event.keyCode === 27) {
			// escape
			//
			event.currentTarget.blur()
			this.setState(state => (state.open ? { open: false } : null))
		} else if (event.keyCode === 13) {
			// enter
			event.preventDefault()
		} else if (event.keyCode === 38) {
			// up
			event.preventDefault()
			this.setState(({ focus, results: { size } }) => ({
				focus: (focus + size - 1) % size,
			}))
		} else if (event.keyCode === 40) {
			// down
			event.preventDefault()
			this.setState(({ focus, results: { size } }) => ({
				focus: (focus + 1) % size,
			}))
		}
	}

	render() {
		const { value, open } = this.state

		return (
			<div className="identity">
				<input
					type="text"
					autoFocus={this.props.autoFocus}
					placeholder={Identity.Placeholder}
					value={value}
					onChange={this.handleChange}
					onKeyDown={this.handleKeyDown}
				/>
				{open && value.trim().length > 0 ? this.renderDrawer() : null}
			</div>
		)
	}

	renderDrawer() {
		const { value, focus, results } = this.state
		return (
			<div className="drawer">
				{results.map((result, index) => {
					const className = ["result"]
					if (focus === index) {
						className.push("focused")
					}
					if (result.size === 0) {
						className.push("create")
						return (
							<div key={index} className={className.join(" ")}>
								- Create blank node{" "}
								<span className="blank">
									<span className="prefix">_:</span>
									<span className="name">{Identity.sanitizeId(value)}</span>
								</span>
							</div>
						)
					} else {
						return null
					}
				})}
			</div>
		)
	}
}
