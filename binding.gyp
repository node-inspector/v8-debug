{
  'variables': {
    'node_next': '<!(node -e "console.log(process.versions.modules > 45)")'
  },
  'targets': [
    {
      'target_name': 'debug',
      'win_delay_load_hook': 'true',
      'sources': [
        'src/debug.cc'
      ],
      'include_dirs' : [
        "<!(node -e \"require('nan')\")"
      ],
      'conditions' : [
        ['node_next=="true"', {
            'sources': [
                'src/InjectedScriptHost.cc'
            ],
            'defines': ['NODE_NEXT=true']
        }]
      ]
    },
    {
      "target_name": "action_after_build",
      "type": "none",
      "dependencies": [ "<(module_name)" ],
      "copies": [
        {
          "files": [ "<(PRODUCT_DIR)/<(module_name).node" ],
          "destination": "<(module_path)"
        }
      ]
    }
  ]
}
