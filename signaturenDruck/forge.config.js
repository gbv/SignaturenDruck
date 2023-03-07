module.exports = {
  packagerConfig: {
    extraResource: 'defaultFiles'
  },
  rebuildConfig: {},
  makers: [
    {
      name: '@electron-forge/maker-squirrel',
      config: {
        certificateFile: '../../../codeThulbSign.pfx',
        certificatePassword: '',
        authors: 'ThULB - IMS'
      },
    },
    {
      name: '@electron-forge/maker-wix',
      config: {
        certificateFile: '../../../codeThulbSign.pfx',
        certificatePassword: '',
        language: 1031,
        manufacturer: 'ThULB - IMS'
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
