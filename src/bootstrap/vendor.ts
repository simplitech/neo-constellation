/**
 * @file
 * Vendor bootstrap
 *
 * This file contains the initialization of vendors library
 */
import Vue from 'vue'
import moment from 'moment'

import 'animate.css'
import './registerServiceWorker'
import '@fortawesome/fontawesome-free/css/all.css'

import VueMeta from 'vue-meta'
import VueMoment from 'vue-moment'

Vue.use(VueMeta)
Vue.use(VueMoment, {moment})
