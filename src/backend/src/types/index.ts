import {OptionsType as CommonOptionsType } from '../../../common/types'

export type OptionsType = CommonOptionsType & {
   root?: string,        // Constraint on the filesystem available to users
   ['404']?: string,     // 404 Response
}