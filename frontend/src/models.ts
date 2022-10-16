export interface Post {
  no: number
  cid: number
  text: string
  image: string
  pid: number
  likes: number
  comments: number
  shares: number
  post_time: string
  scraped_at: string
}

export interface Distribution {
  range: string
  count: number
}

export interface Median {
  post_time: string
  median: number
}

export interface Frequency {
  post_time: string
  count: number
}

export interface Network {
  root: number
  nodes: string
  nodes_count: number
  edges: string
  edges_count: number
  longest_path: string
  longest_path_length: number
}

export type Terms = Record<string, Record<string, number>>