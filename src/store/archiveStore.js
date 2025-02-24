import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import axios from 'axios';

const useArchiveStore = create(
  persist(
    (set, get) => ({
      // Data
      data: {
        mentors: new Map(),
        mentees: new Map(),
        meetings: new Map(),
      },
      pageData: {
        mentors: { total: 0, currentPage: 0 },
        mentees: { total: 0, currentPage: 0 },
        meetings: { total: 0, currentPage: 0 },
      },
      stats: { mentors: 0, mentees: 0, meetings: 0 },
      loading: false,
      error: null,
      searchParams: null,

      // Actions
      fetchPageData: async (viewType, page, pageSize = 10) => {
        const { searchParams } = get();
        if (!searchParams) return;
        
        // set(state => ({ loading: true, error: null }));
        try {
          // Update endpoint mapping
          const endpointMap = {
            mentors: 'getMentors',
            mentees: 'getMentees',
            meetings: 'getMeetings'
          };

          const response = await axios.get(`/api/archive/${endpointMap[viewType]}`, {
            params: {
              ...searchParams,
              page,
              pageSize
            }
          });

          const items = (response.data?.items || []).map((item, index) => ({
            ...item,
            id: item.id || `${viewType}-${page * pageSize + index}`,
            serialNumber: item.serialNumber || page * pageSize + index + 1
          }));

          set(state => ({
            data: {
              ...state.data,
              [viewType]: new Map([
                ...Array.from(state.data[viewType].entries()),
                ...items.map(item => [item.id, item])
              ])
            },
            pageData: {
              ...state.pageData,
              [viewType]: {
                total: response.data?.total || 0,
                currentPage: page
              }
            }
          }));
        } catch (error) {
          set({ error: error.message });
        } finally {
          set({ loading: false });
        }
      },

      fetchInitialData: async (searchParams) => {
        set({ loading: true, error: null, searchParams });
        try {
          // Fetch stats and all mentors in parallel
          const [statsResponse, mentorsResponse] = await Promise.all([
            axios.get('/api/archive/getStats', { params: searchParams }),
            axios.get('/api/archive/getMentors', { 
              params: { ...searchParams, pageSize: 'all' }
            })
          ]);

          // Process all mentors for search
          const mentorsMap = new Map(
            mentorsResponse.data.items.map(mentor => [mentor.id, mentor])
          );

          set({
            stats: statsResponse.data,
            data: {
              ...get().data,
              mentors: mentorsMap
            },
            pageData: {
              ...get().pageData,
              mentors: {
                total: mentorsResponse.data.total,
                currentPage: 0
              }
            }
          });
        } catch (error) {
          set({ error: error.message });
        } finally {
          set({ loading: false });
        }
      },

      fetchViewData: async (viewType, searchParams) => {
        set({ loading: true, error: null });
        try {
          const endpointMap = {
            mentors: 'getMentors',
            mentees: 'getMentees',
            meetings: 'getMeetings'
          };

          // Always fetch all data
          const response = await axios.get(`/api/archive/${endpointMap[viewType]}`, {
            params: {
              ...searchParams,
              pageSize: 'all' // Always fetch all items
            }
          });

          const items = (response.data?.items || []).map((item, index) => ({
            ...item,
            id: item.id || `${viewType}-${index}`,
            serialNumber: item.serialNumber || index + 1
          }));

          set(state => ({
            data: {
              ...state.data,
              [viewType]: new Map(items.map(item => [item.id, item]))
            },
            pageData: {
              ...state.pageData,
              [viewType]: {
                total: items.length,
                currentPage: 0
              }
            }
          }));
        } catch (error) {
          set({ error: error.message });
        } finally {
          set({ loading: false });
        }
      },

      // Search functionality
      searchData: (viewType, searchTerm) => {
        const dataMap = get().data[viewType];
        if (!searchTerm.trim()) return Array.from(dataMap.values());

        const searchLower = searchTerm.toLowerCase();
        return Array.from(dataMap.values()).filter(item => 
          item.MUJid?.toLowerCase().includes(searchLower) ||
          item.name?.toLowerCase().includes(searchLower) ||
          item.email?.toLowerCase().includes(searchLower)
        );
      },

      // Clear cached data
      clearCache: () => {
        set({
          data: {
            mentors: new Map(),
            mentees: new Map(),
            meetings: new Map(),
          },
          pageData: {
            mentors: { total: 0, currentPage: 0 },
            mentees: { total: 0, currentPage: 0 },
            meetings: { total: 0, currentPage: 0 },
          }
        });
      },

      // Initialize with search params
      setSearchParams: (params) => {
        set({ searchParams: params });
        get().clearCache();
      }
    }),
    {
      name: 'archive-store',
      partialize: (state) => ({
        stats: state.stats,
        searchParams: state.searchParams
      })
    }
  )
);

export default useArchiveStore;
