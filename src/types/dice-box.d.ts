declare module '@3d-dice/dice-box' {
  export default class DiceBox {
    constructor(options: Record<string, unknown> & { container: string })
    init(): Promise<unknown>
    roll(notation: string | string[]): void
    clear(): void
  }
}
