import type { SearchResults } from '@db/app-bar-search/types'

interface DB {
  searchItems: SearchResults[]
}

export const db: DB = {
  searchItems: [
    {
      title: 'Dashboards',
      category: 'dashboards',
      children: [
        {
          url: { name: 'dashboards' },
          icon: 'bx-bar-chart',
          title: 'Analytics Dashboard',
        },
      ],
    },

  ],
}
