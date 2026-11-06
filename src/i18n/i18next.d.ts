import 'i18next'

import type ru from './ru.json'

declare module 'i18next' {
  interface CustomTypeOptions {
    keySeparator: false
    nsSeparator: false
    resources: { translation: typeof ru }
  }
}
