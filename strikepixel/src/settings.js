// SPDX-License-Identifier: Apache-2.0
export const SETTINGS_KEY='strikepixel.settings.v1';
export const DEFAULT_SETTINGS=Object.freeze({kind:SETTINGS_KEY,sensitivity:1,invertY:false,music:true,effects:true,difficulty:'casual',match:'arena'});
export function validateSettings(value){
  if(!value||Object.getPrototypeOf(value)!==Object.prototype)throw new TypeError('Settings must be a plain record');
  const keys=Object.keys(DEFAULT_SETTINGS),fields=Object.getOwnPropertyDescriptors(value);
  if(Reflect.ownKeys(value).length!==keys.length||keys.some(k=>!Object.hasOwn(fields,k)||!Object.hasOwn(fields[k],'value')))throw new TypeError('Unknown or missing settings');
  if(value.kind!==SETTINGS_KEY||!Number.isFinite(value.sensitivity)||value.sensitivity<.4||value.sensitivity>2.2||!['casual','standard'].includes(value.difficulty)||!['quick','arena'].includes(value.match))throw new RangeError('Unsupported settings');
  for(const key of ['invertY','music','effects'])if(typeof value[key]!=='boolean')throw new TypeError('Settings switches must be boolean');
  return {...value};
}
export function parseSettings(text){
  if(typeof text!=='string'||text.length>2048)throw new RangeError('Settings record is too large');
  return validateSettings(JSON.parse(text));
}
