// مولَّد تلقائياً من project/layers/app_layers.lyrx بواسطة project/tools/lyrx_to_js.py — لا تعدّله يدوياً.
window.APP_LAYERS = [
 {
  "id": "border",
  "title": "حدود فلسطين",
  "url": "https://services8.arcgis.com/x3OYmfTujNHGdoex/arcgis/rest/services/Palestine_Border_gdb/FeatureServer/0",
  "visible": true,
  "opacity": 1.0,
  "renderer": {
   "type": "simple",
   "symbol": {
    "type": "cim",
    "data": {
     "type": "CIMSymbolReference",
     "symbol": {
      "type": "CIMPolygonSymbol",
      "symbolLayers": [
       {
        "type": "CIMSolidStroke",
        "effects": [
         {
          "type": "CIMGeometricEffectDashes",
          "dashTemplate": [
           5.625,
           1.875,
           1.875,
           1.875,
           1.875,
           1.875
          ],
          "lineDashEnding": "NoConstraint",
          "controlPointEnding": "NoConstraint"
         }
        ],
        "enable": true,
        "colorLocked": true,
        "capStyle": "Butt",
        "joinStyle": "Round",
        "lineStyle3D": "Strip",
        "miterLimit": 10,
        "width": 1.875,
        "height3D": 1,
        "anchor3D": "Center",
        "color": [
         112,
         112,
         112,
         255
        ]
       }
      ],
      "angleAlignment": "Map"
     }
    }
   }
  },
  "labelsVisible": false,
  "labelingInfo": [
   {
    "labelExpressionInfo": {
     "expression": "$feature.ENTITY"
    },
    "labelPlacement": "always-horizontal",
    "symbol": {
     "type": "text",
     "color": [
      0,
      0,
      0,
      1.0
     ],
     "font": {
      "family": "Arial",
      "size": 10,
      "weight": "normal"
     }
    }
   }
  ]
 },
 {
  "id": "governorates",
  "title": "المحافظة",
  "url": "https://services8.arcgis.com/x3OYmfTujNHGdoex/arcgis/rest/services/Governorate/FeatureServer/0",
  "visible": true,
  "opacity": 1.0,
  "renderer": {
   "type": "unique-value",
   "field": "NAME_EN",
   "uniqueValueInfos": [
    {
     "value": "Deir Al Balah",
     "label": "Deir Al Balah",
     "symbol": {
      "type": "cim",
      "data": {
       "type": "CIMSymbolReference",
       "symbol": {
        "type": "CIMPolygonSymbol",
        "symbolLayers": [
         {
          "type": "CIMSolidStroke",
          "enable": true,
          "colorLocked": true,
          "capStyle": "Butt",
          "joinStyle": "Round",
          "lineStyle3D": "Strip",
          "miterLimit": 10,
          "width": 0.488,
          "height3D": 1,
          "anchor3D": "Center",
          "color": [
           0,
           0,
           0,
           255
          ]
         },
         {
          "type": "CIMSolidFill",
          "enable": true,
          "color": [
           230,
           81,
           84,
           105
          ]
         }
        ],
        "angleAlignment": "Map"
       }
      }
     }
    },
    {
     "value": "Gaza",
     "label": "Gaza",
     "symbol": {
      "type": "cim",
      "data": {
       "type": "CIMSymbolReference",
       "symbol": {
        "type": "CIMPolygonSymbol",
        "symbolLayers": [
         {
          "type": "CIMSolidStroke",
          "enable": true,
          "colorLocked": true,
          "capStyle": "Butt",
          "joinStyle": "Round",
          "lineStyle3D": "Strip",
          "miterLimit": 10,
          "width": 0.488,
          "height3D": 1,
          "anchor3D": "Center",
          "color": [
           0,
           0,
           0,
           255
          ]
         },
         {
          "type": "CIMSolidFill",
          "enable": true,
          "color": [
           38,
           182,
           255,
           105
          ]
         }
        ],
        "angleAlignment": "Map"
       }
      }
     }
    },
    {
     "value": "Bethlehem",
     "label": "Bethlehem",
     "symbol": {
      "type": "cim",
      "data": {
       "type": "CIMSymbolReference",
       "symbol": {
        "type": "CIMPolygonSymbol",
        "symbolLayers": [
         {
          "type": "CIMSolidStroke",
          "enable": true,
          "colorLocked": true,
          "capStyle": "Butt",
          "joinStyle": "Round",
          "lineStyle3D": "Strip",
          "miterLimit": 10,
          "width": 0.488,
          "height3D": 1,
          "anchor3D": "Center",
          "color": [
           0,
           0,
           0,
           255
          ]
         },
         {
          "type": "CIMSolidFill",
          "enable": true,
          "color": [
           103,
           230,
           209,
           105
          ]
         }
        ],
        "angleAlignment": "Map"
       }
      }
     }
    },
    {
     "value": "Hebron",
     "label": "Hebron",
     "symbol": {
      "type": "cim",
      "data": {
       "type": "CIMSymbolReference",
       "symbol": {
        "type": "CIMPolygonSymbol",
        "symbolLayers": [
         {
          "type": "CIMSolidStroke",
          "enable": true,
          "colorLocked": true,
          "capStyle": "Butt",
          "joinStyle": "Round",
          "lineStyle3D": "Strip",
          "miterLimit": 10,
          "width": 0.488,
          "height3D": 1,
          "anchor3D": "Center",
          "color": [
           0,
           0,
           0,
           255
          ]
         },
         {
          "type": "CIMSolidFill",
          "enable": true,
          "color": [
           205,
           118,
           214,
           105
          ]
         }
        ],
        "angleAlignment": "Map"
       }
      }
     }
    },
    {
     "value": "Jenin",
     "label": "Jenin",
     "symbol": {
      "type": "cim",
      "data": {
       "type": "CIMSymbolReference",
       "symbol": {
        "type": "CIMPolygonSymbol",
        "symbolLayers": [
         {
          "type": "CIMSolidStroke",
          "enable": true,
          "colorLocked": true,
          "capStyle": "Butt",
          "joinStyle": "Round",
          "lineStyle3D": "Strip",
          "miterLimit": 10,
          "width": 0.488,
          "height3D": 1,
          "anchor3D": "Center",
          "color": [
           0,
           0,
           0,
           255
          ]
         },
         {
          "type": "CIMSolidFill",
          "enable": true,
          "color": [
           255,
           202,
           140,
           105
          ]
         }
        ],
        "angleAlignment": "Map"
       }
      }
     }
    },
    {
     "value": "Jericho & Al Aghwar",
     "label": "Jericho & Al Aghwar",
     "symbol": {
      "type": "cim",
      "data": {
       "type": "CIMSymbolReference",
       "symbol": {
        "type": "CIMPolygonSymbol",
        "symbolLayers": [
         {
          "type": "CIMSolidStroke",
          "enable": true,
          "colorLocked": true,
          "capStyle": "Butt",
          "joinStyle": "Round",
          "lineStyle3D": "Strip",
          "miterLimit": 10,
          "width": 0.488,
          "height3D": 1,
          "anchor3D": "Center",
          "color": [
           0,
           0,
           0,
           255
          ]
         },
         {
          "type": "CIMSolidFill",
          "enable": true,
          "color": [
           255,
           242,
           179,
           105
          ]
         }
        ],
        "angleAlignment": "Map"
       }
      }
     }
    },
    {
     "value": "Jerusalem",
     "label": "Jerusalem",
     "symbol": {
      "type": "cim",
      "data": {
       "type": "CIMSymbolReference",
       "symbol": {
        "type": "CIMPolygonSymbol",
        "symbolLayers": [
         {
          "type": "CIMSolidStroke",
          "enable": true,
          "colorLocked": true,
          "capStyle": "Butt",
          "joinStyle": "Round",
          "lineStyle3D": "Strip",
          "miterLimit": 10,
          "width": 0.488,
          "height3D": 1,
          "anchor3D": "Center",
          "color": [
           0,
           0,
           0,
           255
          ]
         },
         {
          "type": "CIMSolidFill",
          "enable": true,
          "color": [
           255,
           140,
           217,
           105
          ]
         }
        ],
        "angleAlignment": "Map"
       }
      }
     }
    },
    {
     "value": "Khan Yunis",
     "label": "Khan Yunis",
     "symbol": {
      "type": "cim",
      "data": {
       "type": "CIMSymbolReference",
       "symbol": {
        "type": "CIMPolygonSymbol",
        "symbolLayers": [
         {
          "type": "CIMSolidStroke",
          "enable": true,
          "colorLocked": true,
          "capStyle": "Butt",
          "joinStyle": "Round",
          "lineStyle3D": "Strip",
          "miterLimit": 10,
          "width": 0.488,
          "height3D": 1,
          "anchor3D": "Center",
          "color": [
           0,
           0,
           0,
           255
          ]
         },
         {
          "type": "CIMSolidFill",
          "enable": true,
          "color": [
           217,
           157,
           91,
           105
          ]
         }
        ],
        "angleAlignment": "Map"
       }
      }
     }
    },
    {
     "value": "Nablus",
     "label": "Nablus",
     "symbol": {
      "type": "cim",
      "data": {
       "type": "CIMSymbolReference",
       "symbol": {
        "type": "CIMPolygonSymbol",
        "symbolLayers": [
         {
          "type": "CIMSolidStroke",
          "enable": true,
          "colorLocked": true,
          "capStyle": "Butt",
          "joinStyle": "Round",
          "lineStyle3D": "Strip",
          "miterLimit": 10,
          "width": 0.488,
          "height3D": 1,
          "anchor3D": "Center",
          "color": [
           0,
           0,
           0,
           255
          ]
         },
         {
          "type": "CIMSolidFill",
          "enable": true,
          "color": [
           200,
           242,
           169,
           105
          ]
         }
        ],
        "angleAlignment": "Map"
       }
      }
     }
    },
    {
     "value": "North Gaza",
     "label": "North Gaza",
     "symbol": {
      "type": "cim",
      "data": {
       "type": "CIMSymbolReference",
       "symbol": {
        "type": "CIMPolygonSymbol",
        "symbolLayers": [
         {
          "type": "CIMSolidStroke",
          "enable": true,
          "colorLocked": true,
          "capStyle": "Butt",
          "joinStyle": "Round",
          "lineStyle3D": "Strip",
          "miterLimit": 10,
          "width": 0.488,
          "height3D": 1,
          "anchor3D": "Center",
          "color": [
           0,
           0,
           0,
           255
          ]
         },
         {
          "type": "CIMSolidFill",
          "enable": true,
          "color": [
           212,
           184,
           255,
           105
          ]
         }
        ],
        "angleAlignment": "Map"
       }
      }
     }
    },
    {
     "value": "Qalqiliya",
     "label": "Qalqiliya",
     "symbol": {
      "type": "cim",
      "data": {
       "type": "CIMSymbolReference",
       "symbol": {
        "type": "CIMPolygonSymbol",
        "symbolLayers": [
         {
          "type": "CIMSolidStroke",
          "enable": true,
          "colorLocked": true,
          "capStyle": "Butt",
          "joinStyle": "Round",
          "lineStyle3D": "Strip",
          "miterLimit": 10,
          "width": 0.488,
          "height3D": 1,
          "anchor3D": "Center",
          "color": [
           0,
           0,
           0,
           255
          ]
         },
         {
          "type": "CIMSolidFill",
          "enable": true,
          "color": [
           255,
           222,
           160,
           105
          ]
         }
        ],
        "angleAlignment": "Map"
       }
      }
     }
    },
    {
     "value": "Rafah",
     "label": "Rafah",
     "symbol": {
      "type": "cim",
      "data": {
       "type": "CIMSymbolReference",
       "symbol": {
        "type": "CIMPolygonSymbol",
        "symbolLayers": [
         {
          "type": "CIMSolidStroke",
          "enable": true,
          "colorLocked": true,
          "capStyle": "Butt",
          "joinStyle": "Round",
          "lineStyle3D": "Strip",
          "miterLimit": 10,
          "width": 0.488,
          "height3D": 1,
          "anchor3D": "Center",
          "color": [
           0,
           0,
           0,
           255
          ]
         },
         {
          "type": "CIMSolidFill",
          "enable": true,
          "color": [
           71,
           206,
           232,
           105
          ]
         }
        ],
        "angleAlignment": "Map"
       }
      }
     }
    },
    {
     "value": "Ramallah & Al Bireh",
     "label": "Ramallah & Al Bireh",
     "symbol": {
      "type": "cim",
      "data": {
       "type": "CIMSymbolReference",
       "symbol": {
        "type": "CIMPolygonSymbol",
        "symbolLayers": [
         {
          "type": "CIMSolidStroke",
          "enable": true,
          "colorLocked": true,
          "capStyle": "Butt",
          "joinStyle": "Round",
          "lineStyle3D": "Strip",
          "miterLimit": 10,
          "width": 0.488,
          "height3D": 1,
          "anchor3D": "Center",
          "color": [
           0,
           0,
           0,
           255
          ]
         },
         {
          "type": "CIMSolidFill",
          "enable": true,
          "color": [
           230,
           160,
           177,
           105
          ]
         }
        ],
        "angleAlignment": "Map"
       }
      }
     }
    },
    {
     "value": "Salfit",
     "label": "Salfit",
     "symbol": {
      "type": "cim",
      "data": {
       "type": "CIMSymbolReference",
       "symbol": {
        "type": "CIMPolygonSymbol",
        "symbolLayers": [
         {
          "type": "CIMSolidStroke",
          "enable": true,
          "colorLocked": true,
          "capStyle": "Butt",
          "joinStyle": "Round",
          "lineStyle3D": "Strip",
          "miterLimit": 10,
          "width": 0.488,
          "height3D": 1,
          "anchor3D": "Center",
          "color": [
           0,
           0,
           0,
           255
          ]
         },
         {
          "type": "CIMSolidFill",
          "enable": true,
          "color": [
           154,
           174,
           212,
           105
          ]
         }
        ],
        "angleAlignment": "Map"
       }
      }
     }
    },
    {
     "value": "Tubas & Northern Valleys",
     "label": "Tubas & Northern Valleys",
     "symbol": {
      "type": "cim",
      "data": {
       "type": "CIMSymbolReference",
       "symbol": {
        "type": "CIMPolygonSymbol",
        "symbolLayers": [
         {
          "type": "CIMSolidStroke",
          "enable": true,
          "colorLocked": true,
          "capStyle": "Butt",
          "joinStyle": "Round",
          "lineStyle3D": "Strip",
          "miterLimit": 10,
          "width": 0.488,
          "height3D": 1,
          "anchor3D": "Center",
          "color": [
           0,
           0,
           0,
           255
          ]
         },
         {
          "type": "CIMSolidFill",
          "enable": true,
          "color": [
           255,
           191,
           198,
           105
          ]
         }
        ],
        "angleAlignment": "Map"
       }
      }
     }
    },
    {
     "value": "Tulkarm",
     "label": "Tulkarm",
     "symbol": {
      "type": "cim",
      "data": {
       "type": "CIMSymbolReference",
       "symbol": {
        "type": "CIMPolygonSymbol",
        "symbolLayers": [
         {
          "type": "CIMSolidStroke",
          "enable": true,
          "colorLocked": true,
          "capStyle": "Butt",
          "joinStyle": "Round",
          "lineStyle3D": "Strip",
          "miterLimit": 10,
          "width": 0.488,
          "height3D": 1,
          "anchor3D": "Center",
          "color": [
           0,
           0,
           0,
           255
          ]
         },
         {
          "type": "CIMSolidFill",
          "enable": true,
          "color": [
           134,
           132,
           170,
           105
          ]
         }
        ],
        "angleAlignment": "Map"
       }
      }
     }
    }
   ]
  },
  "labelsVisible": true,
  "labelingInfo": [
   {
    "labelExpressionInfo": {
     "expression": "$feature[\"NAME_AR\"]"
    },
    "labelPlacement": "always-horizontal",
    "symbol": {
     "type": "text",
     "color": [
      38,
      38,
      38,
      1.0
     ],
     "font": {
      "family": "Arial",
      "size": 10,
      "weight": "normal"
     },
     "haloColor": [
      247,
      247,
      247,
      1.0
     ],
     "haloSize": 0.75
    },
    "maxScale": 232720.40504050415
   }
  ],
  "maxScale": 288895.277144
 },
 {
  "id": "localities",
  "title": "التجمعات السكانية 2026",
  "url": "https://services8.arcgis.com/x3OYmfTujNHGdoex/arcgis/rest/services/Localities_2026/FeatureServer/4",
  "visible": true,
  "opacity": 1.0,
  "renderer": {
   "type": "simple",
   "symbol": {
    "type": "cim",
    "data": {
     "type": "CIMSymbolReference",
     "symbol": {
      "type": "CIMPolygonSymbol",
      "symbolLayers": [
       {
        "type": "CIMSolidStroke",
        "enable": true,
        "colorLocked": true,
        "capStyle": "Butt",
        "joinStyle": "Round",
        "lineStyle3D": "Strip",
        "miterLimit": 10,
        "width": 1.5,
        "height3D": 1,
        "anchor3D": "Center",
        "color": [
         237,
         250,
         0,
         255
        ]
       },
       {
        "type": "CIMSolidFill",
        "enable": true,
        "color": [
         130,
         130,
         130,
         0
        ]
       }
      ],
      "angleAlignment": "Map"
     }
    }
   }
  },
  "labelsVisible": true,
  "labelingInfo": [
   {
    "labelExpressionInfo": {
     "expression": "$feature[\"Loc_Name\"]"
    },
    "labelPlacement": "always-horizontal",
    "symbol": {
     "type": "text",
     "color": [
      237,
      250,
      0,
      1.0
     ],
     "font": {
      "family": "Arial",
      "size": 19,
      "weight": "bold"
     },
     "haloColor": [
      0,
      0,
      0,
      1.0
     ],
     "haloSize": 1.5
    },
    "minScale": 72223.819286
   }
  ],
  "minScale": 288895.277144
 },
 {
  "id": "govBorders",
  "title": "حدود المحافظات",
  "url": "https://services8.arcgis.com/x3OYmfTujNHGdoex/arcgis/rest/services/Governorate/FeatureServer/0",
  "visible": true,
  "opacity": 1.0,
  "renderer": {
   "type": "simple",
   "symbol": {
    "type": "cim",
    "data": {
     "type": "CIMSymbolReference",
     "symbol": {
      "type": "CIMPolygonSymbol",
      "symbolLayers": [
       {
        "type": "CIMSolidStroke",
        "enable": true,
        "colorLocked": true,
        "capStyle": "Butt",
        "joinStyle": "Round",
        "lineStyle3D": "Strip",
        "miterLimit": 10,
        "width": 3,
        "height3D": 1,
        "anchor3D": "Center",
        "color": [
         0,
         0,
         0,
         255
        ]
       },
       {
        "type": "CIMSolidFill",
        "enable": true,
        "color": [
         0,
         0,
         0,
         0
        ]
       }
      ],
      "angleAlignment": "Map"
     }
    }
   }
  },
  "labelsVisible": false,
  "labelingInfo": [
   {
    "labelExpressionInfo": {
     "expression": "$feature[\"NAME_AR\"]"
    },
    "labelPlacement": "always-horizontal",
    "symbol": {
     "type": "text",
     "color": [
      38,
      38,
      38,
      1.0
     ],
     "font": {
      "family": "Arial",
      "size": 10,
      "weight": "normal"
     }
    },
    "minScale": 288895.277144,
    "maxScale": 10000
   }
  ],
  "minScale": 288895.277144
 },
 {
  "id": "displaced",
  "title": "القرى الفلسطينية المهجرة",
  "url": "https://services8.arcgis.com/x3OYmfTujNHGdoex/arcgis/rest/services/Displaced_Palestinian_Villages/FeatureServer/0",
  "visible": false,
  "opacity": 1.0,
  "renderer": {
   "type": "simple",
   "symbol": {
    "type": "cim",
    "data": {
     "type": "CIMSymbolReference",
     "symbol": {
      "type": "CIMPolygonSymbol",
      "symbolLayers": [
       {
        "type": "CIMSolidStroke",
        "enable": true,
        "colorLocked": true,
        "capStyle": "Butt",
        "joinStyle": "Round",
        "lineStyle3D": "Strip",
        "miterLimit": 10,
        "width": 0.75,
        "height3D": 1,
        "anchor3D": "Center",
        "color": [
         36,
         36,
         36,
         255
        ]
       },
       {
        "type": "CIMSolidFill",
        "enable": true,
        "color": [
         112,
         112,
         112,
         255
        ]
       }
      ],
      "angleAlignment": "Map"
     }
    }
   }
  },
  "labelsVisible": false,
  "labelingInfo": [
   {
    "labelExpressionInfo": {
     "expression": "$feature.NAMEAR"
    },
    "labelPlacement": "always-horizontal",
    "symbol": {
     "type": "text",
     "color": [
      0,
      0,
      0,
      1.0
     ],
     "font": {
      "family": "Arial",
      "size": 10,
      "weight": "normal"
     }
    }
   }
  ],
  "minScale": 345580
 },
 {
  "id": "wall",
  "title": "جدار الضم والتوسع",
  "url": "https://services8.arcgis.com/x3OYmfTujNHGdoex/arcgis/rest/services/Wall2020/FeatureServer/0",
  "visible": false,
  "opacity": 1.0,
  "renderer": {
   "type": "unique-value",
   "field": "Status",
   "uniqueValueInfos": [
    {
     "value": "Constructed",
     "label": "مكتمل البناء",
     "symbol": {
      "type": "cim",
      "data": {
       "type": "CIMSymbolReference",
       "symbol": {
        "type": "CIMLineSymbol",
        "symbolLayers": [
         {
          "type": "CIMSolidStroke",
          "enable": true,
          "capStyle": "Butt",
          "joinStyle": "Round",
          "lineStyle3D": "Strip",
          "miterLimit": 10,
          "width": 1.875,
          "height3D": 1,
          "anchor3D": "Center",
          "color": [
           168,
           0,
           0,
           255
          ]
         }
        ]
       }
      }
     }
    },
    {
     "value": "Projected",
     "label": "مُخَطط ومُصادق عليه",
     "symbol": {
      "type": "cim",
      "data": {
       "type": "CIMSymbolReference",
       "symbol": {
        "type": "CIMLineSymbol",
        "symbolLayers": [
         {
          "type": "CIMSolidStroke",
          "effects": [
           {
            "type": "CIMGeometricEffectDashes",
            "dashTemplate": [
             5.625,
             3.75,
             1.875,
             3.75,
             1.875,
             3.75
            ],
            "lineDashEnding": "NoConstraint",
            "controlPointEnding": "NoConstraint"
           }
          ],
          "enable": true,
          "capStyle": "Butt",
          "joinStyle": "Round",
          "lineStyle3D": "Strip",
          "miterLimit": 10,
          "width": 1.875,
          "height3D": 1,
          "anchor3D": "Center",
          "color": [
           168,
           0,
           0,
           255
          ]
         }
        ]
       }
      }
     }
    },
    {
     "value": "Under Construction",
     "label": "قيد الإنشاء",
     "symbol": {
      "type": "cim",
      "data": {
       "type": "CIMSymbolReference",
       "symbol": {
        "type": "CIMLineSymbol",
        "symbolLayers": [
         {
          "type": "CIMSolidStroke",
          "effects": [
           {
            "type": "CIMGeometricEffectDashes",
            "dashTemplate": [
             5.625,
             1.875,
             1.875,
             1.875,
             1.875,
             1.875
            ],
            "lineDashEnding": "NoConstraint",
            "controlPointEnding": "NoConstraint"
           }
          ],
          "enable": true,
          "capStyle": "Butt",
          "joinStyle": "Round",
          "lineStyle3D": "Strip",
          "miterLimit": 10,
          "width": 1.875,
          "height3D": 1,
          "anchor3D": "Center",
          "color": [
           133,
           133,
           133,
           255
          ]
         }
        ]
       }
      }
     }
    }
   ]
  },
  "labelsVisible": false,
  "labelingInfo": [
   {
    "labelExpressionInfo": {
     "expression": "$feature.Status"
    },
    "labelPlacement": "center-along",
    "symbol": {
     "type": "text",
     "color": [
      0,
      0,
      0,
      1.0
     ],
     "font": {
      "family": "Arial",
      "size": 10,
      "weight": "normal"
     }
    }
   }
  ],
  "minScale": 381191
 },
 {
  "id": "settlements",
  "title": "المستعمرات الإسرائيلية",
  "url": "https://services8.arcgis.com/x3OYmfTujNHGdoex/arcgis/rest/services/Israeli_Settlements_LIST2017/FeatureServer/0",
  "visible": false,
  "opacity": 0.5,
  "renderer": {
   "type": "simple",
   "symbol": {
    "type": "cim",
    "data": {
     "type": "CIMSymbolReference",
     "symbol": {
      "type": "CIMPolygonSymbol",
      "symbolLayers": [
       {
        "type": "CIMSolidStroke",
        "enable": true,
        "colorLocked": true,
        "capStyle": "Butt",
        "joinStyle": "Round",
        "lineStyle3D": "Strip",
        "miterLimit": 10,
        "width": 0.4,
        "height3D": 1,
        "anchor3D": "Center",
        "color": [
         110,
         110,
         110,
         255
        ]
       },
       {
        "type": "CIMSolidFill",
        "enable": true,
        "color": [
         197,
         0,
         255,
         255
        ]
       }
      ],
      "angleAlignment": "Map"
     }
    }
   }
  },
  "labelsVisible": true,
  "labelingInfo": [
   {
    "labelExpressionInfo": {
     "expression": "$feature[\"NAME_AR\"]"
    },
    "labelPlacement": "always-horizontal",
    "symbol": {
     "type": "text",
     "color": [
      255,
      215,
      0,
      1.0
     ],
     "font": {
      "family": "Arial",
      "size": 7,
      "weight": "normal"
     },
     "haloColor": [
      0,
      0,
      128,
      1.0
     ],
     "haloSize": 0.75
    }
   }
  ],
  "minScale": 345580
 },
 {
  "id": "outposts",
  "title": "البؤر الإستعمارية",
  "url": "https://services8.arcgis.com/x3OYmfTujNHGdoex/arcgis/rest/services/Israeli_Setlments_Outpost_LIST/FeatureServer/0",
  "visible": false,
  "opacity": 1.0,
  "renderer": {
   "type": "simple",
   "symbol": {
    "type": "cim",
    "data": {
     "type": "CIMSymbolReference",
     "symbol": {
      "type": "CIMPointSymbol",
      "symbolLayers": [
       {
        "type": "CIMPictureMarker",
        "enable": true,
        "anchorPointUnits": "Relative",
        "dominantSizeAxis3D": "Z",
        "size": 9,
        "billboardMode3D": "FaceNearPlane",
        "invertBackfaceTexture": true,
        "scaleX": 1,
        "textureFilter": "Picture",
        "url": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAZdEVYdFNvZnR3YXJlAEFkb2JlIEltYWdlUmVhZHlxyWU8AAADImlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4gPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgNS4wLWMwNjAgNjEuMTM0Nzc3LCAyMDEwLzAyLzEyLTE3OjMyOjAwICAgICAgICAiPiA8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPiA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtbG5zOnhtcE1NPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvbW0vIiB4bWxuczpzdFJlZj0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL3NUeXBlL1Jlc291cmNlUmVmIyIgeG1wOkNyZWF0b3JUb29sPSJBZG9iZSBQaG90b3Nob3AgQ1M1IE1hY2ludG9zaCIgeG1wTU06SW5zdGFuY2VJRD0ieG1wLmlpZDo2RURDNzIyMUQyN0QxMUUwQUU5NUVFMEYwMTY0NzUwNSIgeG1wTU06RG9jdW1lbnRJRD0ieG1wLmRpZDo2RURDNzIyMkQyN0QxMUUwQUU5NUVFMEYwMTY0NzUwNSI+IDx4bXBNTTpEZXJpdmVkRnJvbSBzdFJlZjppbnN0YW5jZUlEPSJ4bXAuaWlkOjZFREM3MjFGRDI3RDExRTBBRTk1RUUwRjAxNjQ3NTA1IiBzdFJlZjpkb2N1bWVudElEPSJ4bXAuZGlkOjZFREM3MjIwRDI3RDExRTBBRTk1RUUwRjAxNjQ3NTA1Ii8+IDwvcmRmOkRlc2NyaXB0aW9uPiA8L3JkZjpSREY+IDwveDp4bXBtZXRhPiA8P3hwYWNrZXQg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"
       }
      ],
      "haloSize": 1,
      "scaleX": 1,
      "angleAlignment": "Display"
     }
    }
   }
  },
  "labelsVisible": false,
  "labelingInfo": [
   {
    "labelExpressionInfo": {
     "expression": "$feature.NAMEMANE"
    },
    "labelPlacement": "above-center",
    "symbol": {
     "type": "text",
     "color": [
      0,
      0,
      0,
      1.0
     ],
     "font": {
      "family": "Arial",
      "size": 10,
      "weight": "normal"
     }
    }
   }
  ],
  "minScale": 398996
 },
 {
  "id": "oslo",
  "title": "A B C تقسيمات اتفاقية اوسلو",
  "url": "https://services8.arcgis.com/x3OYmfTujNHGdoex/arcgis/rest/services/Jurisdiction_Borders_Area_A_B_C_Extract_اوسلو/FeatureServer/0",
  "visible": false,
  "opacity": 0.25,
  "renderer": {
   "type": "unique-value",
   "field": "LandClassificationValue_Arabic",
   "uniqueValueInfos": [
    {
     "value": "منطقة ب",
     "label": "منطقة ب",
     "symbol": {
      "type": "cim",
      "data": {
       "type": "CIMSymbolReference",
       "symbol": {
        "type": "CIMPolygonSymbol",
        "symbolLayers": [
         {
          "type": "CIMSolidStroke",
          "enable": true,
          "colorLocked": true,
          "capStyle": "Butt",
          "joinStyle": "Round",
          "lineStyle3D": "Strip",
          "miterLimit": 10,
          "width": 0.75,
          "height3D": 1,
          "anchor3D": "Center",
          "color": [
           153,
           153,
           153,
           64
          ]
         },
         {
          "type": "CIMSolidFill",
          "enable": true,
          "color": [
           237,
           81,
           81,
           255
          ]
         }
        ],
        "angleAlignment": "Map"
       }
      }
     }
    },
    {
     "value": "منطقة أ",
     "label": "منطقة أ",
     "symbol": {
      "type": "cim",
      "data": {
       "type": "CIMSymbolReference",
       "symbol": {
        "type": "CIMPolygonSymbol",
        "symbolLayers": [
         {
          "type": "CIMSolidStroke",
          "enable": true,
          "colorLocked": true,
          "capStyle": "Butt",
          "joinStyle": "Round",
          "lineStyle3D": "Strip",
          "miterLimit": 10,
          "width": 0.75,
          "height3D": 1,
          "anchor3D": "Center",
          "color": [
           153,
           153,
           153,
           64
          ]
         },
         {
          "type": "CIMSolidFill",
          "enable": true,
          "color": [
           20,
           158,
           206,
           255
          ]
         }
        ],
        "angleAlignment": "Map"
       }
      }
     }
    },
    {
     "value": "محميات طبيعية",
     "label": "محميات طبيعية",
     "symbol": {
      "type": "cim",
      "data": {
       "type": "CIMSymbolReference",
       "symbol": {
        "type": "CIMPolygonSymbol",
        "symbolLayers": [
         {
          "type": "CIMSolidStroke",
          "enable": true,
          "colorLocked": true,
          "capStyle": "Butt",
          "joinStyle": "Round",
          "lineStyle3D": "Strip",
          "miterLimit": 10,
          "width": 0.75,
          "height3D": 1,
          "anchor3D": "Center",
          "color": [
           153,
           153,
           153,
           64
          ]
         },
         {
          "type": "CIMSolidFill",
          "enable": true,
          "color": [
           167,
           198,
           54,
           255
          ]
         }
        ],
        "angleAlignment": "Map"
       }
      }
     }
    },
    {
     "value": "منطقة H1",
     "label": "منطقة H1",
     "symbol": {
      "type": "cim",
      "data": {
       "type": "CIMSymbolReference",
       "symbol": {
        "type": "CIMPolygonSymbol",
        "symbolLayers": [
         {
          "type": "CIMSolidStroke",
          "enable": true,
          "colorLocked": true,
          "capStyle": "Butt",
          "joinStyle": "Round",
          "lineStyle3D": "Strip",
          "miterLimit": 10,
          "width": 0.75,
          "height3D": 1,
          "anchor3D": "Center",
          "color": [
           153,
           153,
           153,
           64
          ]
         },
         {
          "type": "CIMSolidFill",
          "enable": true,
          "color": [
           158,
           85,
           156,
           255
          ]
         }
        ],
        "angleAlignment": "Map"
       }
      }
     }
    },
    {
     "value": "منطقة H2",
     "label": "منطقة H2",
     "symbol": {
      "type": "cim",
      "data": {
       "type": "CIMSymbolReference",
       "symbol": {
        "type": "CIMPolygonSymbol",
        "symbolLayers": [
         {
          "type": "CIMSolidStroke",
          "enable": true,
          "colorLocked": true,
          "capStyle": "Butt",
          "joinStyle": "Round",
          "lineStyle3D": "Strip",
          "miterLimit": 10,
          "width": 0.75,
          "height3D": 1,
          "anchor3D": "Center",
          "color": [
           153,
           153,
           153,
           64
          ]
         },
         {
          "type": "CIMSolidFill",
          "enable": true,
          "color": [
           252,
           146,
           31,
           255
          ]
         }
        ],
        "angleAlignment": "Map"
       }
      }
     }
    },
    {
     "value": "منطقة ج",
     "label": "منطقة ج",
     "symbol": {
      "type": "cim",
      "data": {
       "type": "CIMSymbolReference",
       "symbol": {
        "type": "CIMPolygonSymbol",
        "symbolLayers": [
         {
          "type": "CIMSolidStroke",
          "enable": true,
          "colorLocked": true,
          "capStyle": "Butt",
          "joinStyle": "Round",
          "lineStyle3D": "Strip",
          "miterLimit": 10,
          "width": 0.75,
          "height3D": 1,
          "anchor3D": "Center",
          "color": [
           153,
           153,
           153,
           64
          ]
         },
         {
          "type": "CIMSolidFill",
          "enable": true,
          "color": [
           255,
           222,
           62,
           255
          ]
         }
        ],
        "angleAlignment": "Map"
       }
      }
     }
    }
   ]
  },
  "labelsVisible": false,
  "labelingInfo": [
   {
    "labelExpressionInfo": {
     "expression": "$feature.LayerName_Arabic"
    },
    "labelPlacement": "always-horizontal",
    "symbol": {
     "type": "text",
     "color": [
      0,
      0,
      0,
      1.0
     ],
     "font": {
      "family": "Arial",
      "size": 10,
      "weight": "normal"
     }
    }
   }
  ]
 }
];
