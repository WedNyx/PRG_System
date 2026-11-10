declare module '@3d-dice/dice-box-threejs' {
  const DiceBox: new (seletor: string, config?: Record<string, unknown>) => {
    initialize(): Promise<void>
    roll(notacao: string): Promise<unknown>
    clearDice(): void
  }
  export default DiceBox
}
