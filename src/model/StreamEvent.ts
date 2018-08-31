import moment from 'moment'
import { Stream } from '@/enum/Stream'
import { $ } from '@/simpli'

export default class StreamEvent {
    timestamp?: number
    message?: string[]
    stream?: Stream

    get timelog() {
        return moment(this.timestamp).format($.t('dateFormat.time'))
    }

}
