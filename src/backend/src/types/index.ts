import { SystemInfo } from 'src/core/types/system'

export type BackendSystemInfo = SystemInfo & {
   ['404']?: string,     // 404 Response
}