module.exports = {
  packagerConfig: {
    extraResource: 'defaultFiles',
    icon: './icon.ico'
  },
  rebuildConfig: {},
  makers: [
    {
      name: '@electron-forge/maker-squirrel',
      config: {
        certificateFile: '../../../codeThulbSign.pfx',
        certificatePassword: '',
        authors: 'ThULB - IMS',
        iconURL: '',
        setupIcon: './icon.ico'
      },
    },
    {
      name: '@electron-forge/maker-wix',
      config: {
        certificateFile: '../../../codeThulbSign.pfx',
        certificatePassword: '',
        language: 1031,
        manufacturer: 'ThULB - IMS',
        icon: './icon.ico'
      }
    },
    {
      name: '@electron-forge/maker-zip',
      platforms: ['darwin'],
    },
    {
      name: '@electron-forge/maker-deb',
      config: {},
    },
    {
      name: '@electron-forge/maker-rpm',
      config: {},
    },
  ],
};
