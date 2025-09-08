export declare class Bot {
    private bot;
    private userService;
    private characterService;
    private imageService;
    constructor();
    private setupMiddleware;
    private setupScenes;
    private setupCommands;
    private setupCallbacks;
    private showMainMenu;
    private showCharacterMenu;
    start(): Promise<void>;
    stop(): Promise<void>;
}
//# sourceMappingURL=Bot.d.ts.map