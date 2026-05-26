export interface Resdata<T> {
    err:boolean
    data:T
    msg:string
    token:null|string
}

export interface ServiceData<T> {
    userId:number
    typeUserId:number
    bodyData:T
}

export interface CheckPermSafe<T> {
    data:T|null,
    ok:boolean,
    error?:"NotFoundException"|"UnauthorizedException"|"Erro ao verificar permissão"
}