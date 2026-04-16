export interface ASTNode {
    type: string;
    line: number;
    column: number;
}

export type AnyNode = ASTNode;