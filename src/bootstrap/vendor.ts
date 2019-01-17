/**
 * @file
 * Vendor bootstrap
 *
 * This file contains the initialization of vendors library
 */
import Vue from 'vue'

import 'animate.css'
import './registerServiceWorker'
import '@fortawesome/fontawesome-free/css/all.css'

import VueMeta from 'vue-meta'

Vue.use(VueMeta)
