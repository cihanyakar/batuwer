export class GameSession {
  constructor(
    public readonly lobbyId: string,
    public readonly mapId: string,
    public readonly playerIds: string[],
  ) {}

  start(): void {
    // Future: game loop
  }

  stop(): void {
    // Future: cleanup
  }
}
