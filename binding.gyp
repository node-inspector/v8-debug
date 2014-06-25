{
  'targets': [
    {
      'target_name': 'debug',
      'sources': [
        'src/debug.cc',
      ],
      'include_dirs' : [
        "<!(node -e \"require('nan')\")"
      ]
    }
  ]
}
