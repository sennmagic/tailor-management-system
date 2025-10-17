// API request helpers for useLookup hook
import { fetchAPI } from '@/lib/apiService';
import { LookupOption } from '@/lib/hooks/useLookupTypes';

/**
 * Extracts data array from API response
 */
export function extractDataArray(response: any, entityName?: string): any[] {
  if (Array.isArray(response)) {
    return response;
  }
  
  const entityField = entityName ? `${entityName.toLowerCase()}Info` : '';
  return response?.data || 
         response?.items || 
         response?.results || 
         response?.factoriesInfo || 
         response?.factoryInfo || 
         response?.[entityField] || 
         [];
}

/**
 * Maps API item to LookupOption with special handling for different entity types
 */
export function mapItemToLookupOption(
  item: any, 
  config: { endpoint?: string; entityName?: string; displayField?: string }
): LookupOption | null {
  const id = item._id || item.id;
  if (!id) return null;

  let label = '';

  // Special handling for catalogs - use catalogName and codeNumber
  if (config.endpoint === 'catalogs' || config.endpoint === 'catalog') {
    const catalogName = item.catalogName || item.name;
    const codeNumber = item.codeNumber || item.code || '';
    if (catalogName) {
      label = codeNumber ? `${catalogName} - ${codeNumber}` : catalogName;
    }
  } 
  // Special handling for factories - prefer factoryName
  else if (config.endpoint === 'factory' || config.endpoint === 'factories' || config.isFactoryLookup) {
    const displayFields = ['factoryName', 'name', 'title', 'label', 'displayName', 'factory_id', 'factoryId'];
    for (const field of displayFields) {
      if (item[field] && typeof item[field] === 'string') {
        label = item[field];
        break;
      }
    }
  } 
  // Generic handling for other entities
  else {
    const displayFields = config.displayField ? [config.displayField] : ['name', 'title', 'label', 'displayName'];
    for (const field of displayFields) {
      if (item[field] && typeof item[field] === 'string') {
        label = item[field];
        break;
      }
    }
  }

  if (!label) {
    label = `${config.entityName || 'Item'} ${id}`;
  }

  return { id: String(id), label: String(label) };
}

/**
 * Processes API response and maps to lookup options
 */
export function processApiResponse(
  response: any, 
  config: { endpoint?: string; entityName?: string; displayField?: string; isFactoryLookup?: boolean }
): LookupOption[] {
  const dataArray = extractDataArray(response, config.entityName);
  
  if (!Array.isArray(dataArray)) {
    return [];
  }

  return dataArray
    .map(item => mapItemToLookupOption(item, config))
    .filter((item): item is LookupOption => item !== null);
}

/**
 * Handles measurement type lookup (static options)
 */
export function getMeasurementTypeOptions(): LookupOption[] {
  return [
    { id: 'DAURA SURUWAL', label: 'DAURA SURUWAL' },
    { id: 'SUIT', label: 'SUIT' }
  ];
}

/**
 * Makes API request with fallback handling
 */
export async function makeApiRequest(
  endpoint: string, 
  withAuth: boolean = true
): Promise<{ error?: string; data?: any }> {
  try {
    return await fetchAPI({ 
      endpoint, 
      method: 'GET',
      withAuth 
    });
  } catch (error) {
    return { error: String(error) };
  }
}

/**
 * Handles factory lookup with multiple endpoint attempts
 */
export async function handleFactoryLookup(
  config: { endpoint?: string; entityName?: string; fieldPath: string }
): Promise<{ options: LookupOption[]; error?: string }> {
  const tryEndpoints = ['factory', 'factories'];
  
  for (const endpoint of tryEndpoints) {
    try {

      const result = await makeApiRequest(endpoint, true);
      
      if (!result.error && result.data) {
        const options = processApiResponse(result.data, { 
          ...config, 
          endpoint, 
          isFactoryLookup: true 
        });
        
        if (options.length > 0) {
          return { options };
        }
      }
    } catch (e) {
      // Continue to next endpoint
    }
  }
  
  return { options: [], error: 'Unable to load factory options' };
}

/**
 * Handles regular entity lookup with fallback
 */
export async function handleEntityLookup(
  config: { endpoint?: string; entityName?: string; fieldPath: string; brandFilter?: boolean }
): Promise<{ options: LookupOption[]; error?: string }> {
  let endpoint = config.endpoint || '';
  
  // Handle brand filtering for catalogs
  if (config.endpoint === 'catalogs' && config.brandFilter) {
    endpoint = '/catalogs';
  }

  console.log('[Lookup] Requesting options:', {
    fieldPath: config.fieldPath,
    entityName: config.entityName,
    rawEndpoint: config.endpoint,
    resolvedEndpoint: endpoint
  });

  // Try with authentication first
  let result = await makeApiRequest(endpoint, true);
  
  // If catalogs endpoint fails, try alternative
  if (result.error && config.endpoint === 'catalogs') {
    result = await makeApiRequest('catalogs', true);
  }

  if (!result.error && result.data) {
    const options = processApiResponse(result.data, config);
    if (options.length > 0) {
      return { options };
    }
  }

  // Try without authentication as fallback
  if (result.error) {
    console.log('[Lookup] Retrying without auth:', { fieldPath: config.fieldPath, resolvedEndpoint: endpoint });
    const fallbackResult = await makeApiRequest(endpoint, false);
    
    if (!fallbackResult.error && fallbackResult.data) {
      const options = processApiResponse(fallbackResult.data, config);
      if (options.length > 0) {
        return { options };
      }
    }
  }

  return { options: [], error: 'Unable to load options' };
}
