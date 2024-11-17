export const getCombinations = <T>(arr: T[], k: number): T[][] => {
	const n = arr.length
	const result: T[][] = []

	const generate = (start: number, current: T[]) => {
		if (current.length === k) {
			result.push(current)
			return
		}

		for (let i = start; i < n; i++) {
			generate(i + 1, [...current, arr[i]])
		}
	}

	generate(0, [])
	return result
}
