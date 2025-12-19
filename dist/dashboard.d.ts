import { TurnipAgent } from './agent';
interface DashboardOptions {
    refreshInterval?: number;
}
export declare class Dashboard {
    private agent;
    private refreshInterval;
    private isRunning;
    private intervalId?;
    constructor(agent: TurnipAgent, options?: DashboardOptions);
    /**
     * Clear the console
     */
    private clear;
    /**
     * Print the dashboard header
     */
    private printHeader;
    /**
     * Print wallet info
     */
    private printWalletInfo;
    /**
     * Print token holdings
     */
    private printTokens;
    /**
     * Print recent activity
     */
    private printActivity;
    /**
     * Print footer
     */
    private printFooter;
    /**
     * Render the dashboard
     */
    private render;
    /**
     * Start the dashboard
     */
    start(): Promise<void>;
    /**
     * Stop the dashboard
     */
    stop(): void;
    /**
     * Run a single snapshot (no refresh)
     */
    snapshot(): Promise<void>;
}
/**
 * Print a simple summary without the full dashboard
 */
export declare function printSummary(agent: TurnipAgent): Promise<void>;
export {};
