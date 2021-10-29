export interface IPackageTree {
    [key: string]: IPackageTree[] | string
}
