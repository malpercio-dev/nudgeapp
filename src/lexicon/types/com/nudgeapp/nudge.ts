/**
 * GENERATED CODE - DO NOT MODIFY
 */
import { ValidationResult, BlobRef } from '@atproto/lexicon'
import { lexicons } from '../../../lexicons'
import { isObj, hasProp } from '../../../util'
import { CID } from 'multiformats/cid'

export interface Record {
  /** DID of the account being nudged. */
  subject: string
  createdAt: string
  [k: string]: unknown
}

export function isRecord(v: unknown): v is Record {
  return (
    isObj(v) &&
    hasProp(v, '$type') &&
    (v.$type === 'com.nudgeapp.nudge#main' || v.$type === 'com.nudgeapp.nudge')
  )
}

export function validateRecord(v: unknown): ValidationResult {
  return lexicons.validate('com.nudgeapp.nudge#main', v)
}
