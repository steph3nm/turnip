export interface AssetInfo {
    szDecimals: number;
    name: string;
    maxLeverage: number;
    marginTableId: number;
    isDelisted?: boolean;
    onlyIsolated?: boolean;
}
export declare const DEFAULT_ASSETS: AssetInfo[];
export declare const SUPPORTED_ASSET_NAMES: string[];
