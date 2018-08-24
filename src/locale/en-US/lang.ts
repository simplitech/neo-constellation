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
      fieldNotDefined: 'Field Not Defined',
      unauthorized: 'Restricted Access',
      noServer: 'Could not connect to server',
      validation: 'Validation error',
      required: 'The field \'{0}\' is required',
      invalidEmail: 'The field \'{0}\' must be e-mail',
      invalidDate: 'The field \'{0}\' has not valid date',
      passwordLength: 'The password must have between {0} and {1} characters',
      samePassword: 'The fields password must match',
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

  app: {
    title: 'GeneratorUseCase',
    logout: 'Logout',
    menu: 'Menu',
    add: 'Add',
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
      title: 'Neo Coordinator',
      form: {
        accessKey: 'AWS Access Key',
        accessSecret: 'AWS Access Secret',
        keepLogged: 'Keep me logged in',
        submit: 'Login',
      },
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
        name: 'Name',
        size: 'Size',
        region: 'Region',
        availabilityZone: 'Availability Zone',
      },
    },
  },
}
