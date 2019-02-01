export default class Rule {

  source: string | null = null
  portRangeStart: number | null = null
  portRangeEnd: number | null = null

  equals(rule: Rule): boolean {
    return this.source === rule.source &&
      this.portRangeStart === rule.portRangeStart &&
      this.portRangeEnd === rule.portRangeEnd
  }

}
