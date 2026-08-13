// 검색으로 고를 수 있는 주요 지역 목록.
//
// 좌표를 하드코딩해 둔 이유:
// OpenWeather의 weather?q= 는 한글을 받지 못하고(404), geocoding API는 한글을 받긴 하지만
// '강릉'은 결과가 없고 '강원'은 중국 장위안구가 나오는 등 결과가 불안정하다.
// 그래서 지역 목록과 좌표를 미리 확정해 두고, 검색은 이 목록을 필터링하는 방식으로 처리한다.
// (아래 좌표는 전부 geo/1.0/direct 로 조회해 확인한 값)
//
// sido는 에어코리아 조회에 쓰는 시도명이다.
// 에어코리아는 시 단위가 아닌 시도 단위로만 측정값을 주기 때문에,
// 예를 들어 수원의 실측은 '경기' 전체 측정소의 평균값이 된다.
export const REGIONS = [
  { id: 'seoul', name: '서울', en: 'Seoul', group: '특별·광역시', lat: 37.5667, lon: 126.9783, sido: '서울' },
  { id: 'busan', name: '부산', en: 'Busan', group: '특별·광역시', lat: 35.18, lon: 129.0752, sido: '부산' },
  { id: 'daegu', name: '대구', en: 'Daegu', group: '특별·광역시', lat: 35.8713, lon: 128.6018, sido: '대구' },
  { id: 'incheon', name: '인천', en: 'Incheon', group: '특별·광역시', lat: 37.456, lon: 126.7052, sido: '인천' },
  { id: 'gwangju', name: '광주', en: 'Gwangju', group: '특별·광역시', lat: 35.1595, lon: 126.8515, sido: '광주' },
  { id: 'daejeon', name: '대전', en: 'Daejeon', group: '특별·광역시', lat: 36.3497, lon: 127.3849, sido: '대전' },
  { id: 'ulsan', name: '울산', en: 'Ulsan', group: '특별·광역시', lat: 35.5392, lon: 129.3119, sido: '울산' },
  { id: 'sejong', name: '세종', en: 'Sejong', group: '특별·광역시', lat: 36.48, lon: 127.289, sido: '세종' },

  { id: 'suwon', name: '수원', en: 'Suwon', group: '경기', lat: 37.2633, lon: 127.0287, sido: '경기' },
  { id: 'seongnam', name: '성남', en: 'Seongnam', group: '경기', lat: 37.4202, lon: 127.1262, sido: '경기' },
  { id: 'yongin', name: '용인', en: 'Yongin', group: '경기', lat: 37.2406, lon: 127.1786, sido: '경기' },
  { id: 'goyang', name: '고양', en: 'Goyang', group: '경기', lat: 37.6582, lon: 126.8319, sido: '경기' },
  { id: 'bucheon', name: '부천', en: 'Bucheon', group: '경기', lat: 37.5014, lon: 126.766, sido: '경기' },
  { id: 'ansan', name: '안산', en: 'Ansan', group: '경기', lat: 37.3217, lon: 126.8309, sido: '경기' },
  { id: 'pyeongtaek', name: '평택', en: 'Pyeongtaek', group: '경기', lat: 36.9925, lon: 127.1127, sido: '경기' },

  { id: 'chuncheon', name: '춘천', en: 'Chuncheon', group: '강원', lat: 37.8811, lon: 127.7298, sido: '강원' },
  { id: 'wonju', name: '원주', en: 'Wonju', group: '강원', lat: 37.3421, lon: 127.9198, sido: '강원' },
  { id: 'gangneung', name: '강릉', en: 'Gangneung', group: '강원', lat: 37.7525, lon: 128.876, sido: '강원' },
  { id: 'sokcho', name: '속초', en: 'Sokcho', group: '강원', lat: 38.207, lon: 128.5913, sido: '강원' },

  { id: 'cheongju', name: '청주', en: 'Cheongju', group: '충청', lat: 36.6421, lon: 127.4892, sido: '충북' },
  { id: 'chungju', name: '충주', en: 'Chungju', group: '충청', lat: 36.9907, lon: 127.926, sido: '충북' },
  { id: 'cheonan', name: '천안', en: 'Cheonan', group: '충청', lat: 36.815, lon: 127.1141, sido: '충남' },
  { id: 'asan', name: '아산', en: 'Asan', group: '충청', lat: 36.7899, lon: 127.0027, sido: '충남' },

  { id: 'jeonju', name: '전주', en: 'Jeonju', group: '전라', lat: 35.8238, lon: 127.1473, sido: '전북' },
  { id: 'gunsan', name: '군산', en: 'Gunsan', group: '전라', lat: 35.968, lon: 126.7369, sido: '전북' },
  { id: 'iksan', name: '익산', en: 'Iksan', group: '전라', lat: 35.9479, lon: 126.9578, sido: '전북' },
  { id: 'yeosu', name: '여수', en: 'Yeosu', group: '전라', lat: 34.7546, lon: 127.6599, sido: '전남' },
  { id: 'suncheon', name: '순천', en: 'Suncheon', group: '전라', lat: 34.9505, lon: 127.4873, sido: '전남' },
  { id: 'mokpo', name: '목포', en: 'Mokpo', group: '전라', lat: 34.7903, lon: 126.3848, sido: '전남' },

  { id: 'pohang', name: '포항', en: 'Pohang', group: '경상', lat: 36.0189, lon: 129.3429, sido: '경북' },
  { id: 'gyeongju', name: '경주', en: 'Gyeongju', group: '경상', lat: 35.8557, lon: 129.2249, sido: '경북' },
  { id: 'gumi', name: '구미', en: 'Gumi', group: '경상', lat: 36.1196, lon: 128.3445, sido: '경북' },
  { id: 'andong', name: '안동', en: 'Andong', group: '경상', lat: 36.5635, lon: 128.7261, sido: '경북' },
  { id: 'changwon', name: '창원', en: 'Changwon', group: '경상', lat: 35.228, lon: 128.6819, sido: '경남' },
  { id: 'jinju', name: '진주', en: 'Jinju', group: '경상', lat: 35.1803, lon: 128.108, sido: '경남' },
  { id: 'gimhae', name: '김해', en: 'Gimhae', group: '경상', lat: 35.2311, lon: 128.8908, sido: '경남' },
  { id: 'tongyeong', name: '통영', en: 'Tongyeong', group: '경상', lat: 34.8543, lon: 128.4332, sido: '경남' },

  { id: 'jeju', name: '제주', en: 'Jeju', group: '제주', lat: 33.4998, lon: 126.5314, sido: '제주' },
  { id: 'seogwipo', name: '서귀포', en: 'Seogwipo', group: '제주', lat: 33.2528, lon: 126.561, sido: '제주' },
]

// 검색어로 지역을 찾는다. 한글 지역명과 영문명 모두로 찾을 수 있다.
export const searchRegions = (keyword) => {
  const q = keyword.trim().toLowerCase()
  if (!q) {
    return REGIONS
  }
  return REGIONS.filter((r) => r.name.includes(q) || r.en.toLowerCase().includes(q) || r.group.includes(q))
}

export const findRegion = (id) => REGIONS.find((r) => r.id === id) ?? null
