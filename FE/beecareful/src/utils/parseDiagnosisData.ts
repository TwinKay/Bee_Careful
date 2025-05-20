export const parseDiagnosisData = (data: any) => {
  return {
    larvaCount: data.larvaCount,
    imagoCount: data.imagoCount,
    imagoDisease: [
      {
        name: '진드기(응애)',
        value: data.result.imago?.varroaCount,
        ratio: data.result.imago?.varroaRatio,
        color: '#E57373',
      },
      {
        name: '날개바이러스',
        value: data.result.imago?.dwvCount,
        ratio: data.result.imago?.dwvRatio,
        color: '#FFB74D',
      },
      {
        name: '정상',
        value:
          data.imagoCount -
          (data.result.imago?.varroaCount || 0) -
          (data.result.imago?.dwvCount || 0),
        ratio: 100 - (data.result.imago?.varroaRatio || 0),
        color: '#E6E6E6',
      },
    ],
    larvaDisease: [
      {
        name: '진드기(응애)',
        value: data.result.larva?.varroaCount,
        ratio: data.result.larva?.varroaRatio,
        color: '#E57373',
      },
      {
        name: '부저병',
        value: data.result.larva?.foulBroodCount,
        ratio: data.result.larva?.foulBroodRatio,
        color: '#64B5F6',
      },
      {
        name: '석고병',
        value: data.result.larva?.chalkBroodCount,
        ratio: data.result.larva?.chalkBroodRatio,
        color: '#81C784',
      },
      {
        name: '정상',
        value:
          data.larvaCount -
          (data.result.larva?.varroaCount || 0) -
          (data.result.larva?.foulBroodCount || 0) -
          (data.result.larva?.chalkBroodCount || 0),
        ratio: 100 - (data.result.larva?.varroaRatio || 0),
        color: '#E6E6E6',
      },
    ],
  };
};
