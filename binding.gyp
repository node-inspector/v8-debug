{
  'variables': {
    'node_next': '<!(node -p -e "require(\'./tools/NODE_NEXT.js\')")'
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
            'defines': ['NODE_NEXT=1']
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
