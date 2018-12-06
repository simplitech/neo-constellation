
import HostEntry from '@/model/HostEntry'

export default class Dashboard {

    $id: string | null = null
    hostMap: HostEntry[] = []
    automaticUpdate: boolean = false

}
