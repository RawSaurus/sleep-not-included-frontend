import {TagResponse} from '../api/tag-service';
import {BuildResponse} from '../api/build-service';

export interface BuildEnrichedModel extends BuildResponse{
  tags: TagResponse[],
  thumbnailUrl: string | null,
  buildImageUrls: string[]
}
