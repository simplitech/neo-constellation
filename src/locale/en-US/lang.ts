export default {
  lang: {
    code: 'en-US',
    name: 'English',
    decimal: '.',
    thousands: ',',
  },

  currency: {
    USD: {
      prefix: '$',
      precision: '2',
    },
    BRL: {
      prefix: 'BRL$',
      precision: '2',
    },
  },

  country: {
    BRA: {
      name: 'Brazil',
      alpha2: 'BR',
      alpha3: 'BRA',
      lang: {
        code: 'pt-BR',
        name: 'Portuguese',
      },
    },

    USA: {
      name: 'United States',
      alpha2: 'US',
      alpha3: 'USA',
      lang: {
        code: 'en-US',
        name: 'English',
      },
    },
  },

  system: {
    question: {
      confirmRemove: 'Are you sure you want to remove this item?',
    },
    info: {
      welcome: 'Welcome',
      notImplemented: 'Not Implemented',
    },
    success: {
      resetPassword: 'An E-Mail has been sent to your account',
      recoverPassword: 'The password has successfully changed',
      message: 'Successfully message sent!',
      persist: 'Persisted successfully!',
    },
    error: {
      unexpectedError: 'Unexpected Error',
      fieldNotDefined: 'Field Not Defined',
      unauthorized: 'Restricted Access',
      invalidCredentials: 'Invalid Credentials',
      invalidClientTokenId: 'Invalid Client Token ID',
      noServer: 'Could not connect to server',
      validation: 'Validation error',
      required: 'The field \'{0}\' is required',
      invalidEmail: 'The field \'{0}\' must be e-mail',
      invalidDate: 'The field \'{0}\' has not valid date',
      invalidProtocol: 'Not a valid protocol',
      networkNotEmpty: 'Network is not empty',
      passwordLength: 'The password must have between {0} and {1} characters',
      samePassword: 'The fields password must match',
      invalidPassword: 'Invalid password',
      length: 'The field \'{0}\' must have between {1} and {2} characters',
      maxLength: 'The field \'{0}\' must not exceed {1} characters',
      minLength: 'The field \'{0}\' must have at least {1} characters',
      min: 'The field \'{0}\' must have a minimum value of {1}',
      max: 'The field \'{0}\' must have a maximum value of {1}',
      invalidAlpha: 'The field \'{0}\' must contain only letters',
      invalidAlphanumeric: 'The field \'{0}\' must contain only letters and numbers',
      invalidCreditCard: 'Invalid card credit number',
      format: 'Wrong format for field \'{0}\'',
      phoneFormat: 'Wrong format for phone number',
      zipcodeFormat: 'Wrong format for zip code',
      rgFormat: 'Wrong format for RG document',
      cpfFormat: 'Wrong format for CPF document',
      cnpjFormat: 'Wrong format for CNPJ document',
      geocode: 'Error on getting latitude and longitude. Try again later',
    },
  },

  log: {
    node: {
      describeImages: 'Listing OS Images...',
      describeSecurityGroups: 'Listing Security Groups...',
      describeKeyPairs: 'Listing Key Pairs...',
      describeVpcs: 'Listing VPCs...',
      createSecurityGroup: 'Creating a Security Group...',
      setSecurityGroupRules: 'Setting up Security Group access rules...',
      importKeyPair: 'Importing Key Pair...',
      createKeyPair: 'Creating a Key Pair...',
      getObject: 'Getting Bucket in S3...',
      putObject: 'Puting Bucket into S3...',
      createBucket: 'Creating Bucket into S3...',
      waitFor: 'Waiting for instance to be running...',
      instanceRunning: 'Instance is running!',
      associateIamInstanceProfile: 'AttachingrunInstances Instance Profile...',
      runInstances: 'Running Instances...',
      attachInstanceProfile: 'Attaching Instance Profile...',
      instanceCreated: 'Instance Created',
      startInstances: 'Starting...',
      startedInstances: 'Running',
      stopInstances: 'Stopping...',
      stoppedInstances: 'Stopped',
      terminateInstances: 'Shutting Down...',
      terminatedInstances: 'Terminated',
    },
  },

  app: {
    title: 'Neo Constellation',
    anonymous: 'Anonymous',
    logout: 'Logout',
    turnOn: 'Turn On',
    turnOff: 'Turn Off',
    terminate: 'Terminate',
    menu: 'Menu',
    add: 'Add',
    create: 'Create',
    back: 'Back',
    export: 'Export',
    select: 'Select',
    optional: 'Optional',
    remove: 'Remove',
    cancel: 'Cancel',
    noDataToShow: 'No data to show',
    downloadCsv: 'Download CSV',
    search: 'Search',
    totalLines: '{total} total lines',
    version: 'Version',
    onlyIfWantChangePassword: 'Fill this field only if you want to change the password',
  },

  dateFormat: {
    date: 'MM/DD/YYYY',
    datetime: 'MM/DD/YYYY hh:mm',
    time: 'hh:mm',
    datemask: '##/##/####',
    datetimemask: '##/##/#### ##:##',
  },

  format: {
    cpf: '###.###.###-##',
    cnpj: '##.###.###/####-##',
    rg: '##.###.###-#',
    cep: '#####-###',
    phone: '(##) #####-####',
  },

  boolean: {
    true: 'Yes',
    false: 'No',
  },

  httpResponse: {
    200: 'Ok',
    400: 'Bad Request',
    401: 'Unauthorized',
    402: 'Payment Required',
    403: 'Forbidden',
    404: 'Not Found',
    405: 'Method not Allowed',
    406: 'Not Acceptable',
  },

  view: {
    login: {
      title: 'Neo Constellation',
      form: {
        accessKey: 'AWS Access Key',
        accessSecret: 'AWS Access Secret',
        keepLogged: 'Keep me logged in',
        submit: 'Login',
      },
    },
    dashboard: {
      title: 'Dashboard',
      createNode: 'Create Node',
      reloadList: 'Reload List',
      commands: 'Commands',
    },
    persistNode: {
      title: 'Create Node',
      titleAlt: 'Edit Node',
      newNetwork: 'New Network',
    },
    cmd: {
      title: 'Commands',
      sendCommand: 'Send Command',
    },
  },

  classes: {
    Authentication: {
      title: 'Authentication',
      columns: {
        accessKeyId: 'AWS Access Key',
        secretAccessKey: 'AWS Access Secret',
      },
    },
    Node: {
      title: 'Node',
      columns: {
        $id: 'ID',
        idNetwork: 'Network ID',
        idImage: 'OS Image ID',
        idSecurityGroup: 'SG ID',
        name: 'Name',
        size: 'Size',
        region: 'Region',
        regionMutable: 'Region',
        availabilityZone: 'Availability Zone',
        keyPair: 'Key Pair',
        instanceProfile: 'Instace Profile',
        groupName: 'Group Name',
      },
      state: {
        null: 'Pending',
        0: 'Pending',
        16: 'Running',
        32: 'Shutting Down',
        48: 'Terminated',
        64: 'Stopping',
        80: 'Stopped',
      },
      stateClass: {
        null: 'secondary',
        0: 'secondary',
        16: 'success',
        32: 'secondary',
        48: 'danger',
        64: 'secondary',
        80: 'warning',
      },
    },
    Network: {
      title: 'Network',
      columns: {
        $id: 'ID',
        name: 'Network name',
        nodes: 'Network nodes',
      },
    },
  },
}
