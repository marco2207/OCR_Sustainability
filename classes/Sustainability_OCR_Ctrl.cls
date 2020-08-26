public with sharing class Sustainability_OCR_Ctrl {
    @AuraEnabled
    public static string createContentUrl(String contentDocumentId) {
        string CD_TEMP_PREFIX = 'EinsteinTemp';
        integer EXPIRY = 5;
 
        ContentVersion CV = [select id, Title from ContentVersion where ContentDocumentId =: contentDocumentId and isLatest = true];
        ContentDistribution CD = new ContentDistribution();
        CD.ContentVersionId = CV.Id;
        CD.Name = CD_TEMP_PREFIX + '_' + CV.Title;
        CD.PreferencesAllowOriginalDownload = true;
        CD.PreferencesLinkLatestVersion = true;
        CD.ExpiryDate = system.now().addMinutes(EXPIRY);
        CD.PreferencesExpires = true;
        CD.PreferencesNotifyOnVisit = false;
        CD.PreferencesNotifyRndtnComplete = false;
        insert CD;
 
        ContentDistribution CD2 = [select id, ContentDownloadUrl from ContentDistribution where Id =: cd.Id];
        return CD2.ContentDownloadUrl;
    }
    
    @AuraEnabled
    public static String analyseImageUrl(String url) {
        String convertedText='';
        einsteinplay.Einstein_PredictionService service = new einsteinplay.Einstein_PredictionService(einsteinplay.Einstein_PredictionService.Types.OCR);
        einsteinplay.Einstein_PredictionResult result = service.predictOcrUrl('tabulatev2',  url, 'table', null); 
        system.debug(result);
    
        for(Integer i=0;i<result.probabilities.size();i++)
        {
            if(isColRow(result.probabilities[i].attributes.cellLocation.rowIndex, result.probabilities[i].attributes.cellLocation.colIndex))
            {
                return result.probabilities[i].label;
            }    
        }
        
        return 'No recognized value, please try again or enter manually';
    }
    
    
    public static Boolean isColRow(Integer rowIndex, Integer colIndex)
    {
        system.debug(rowIndex);
        if (rowIndex == 21 && colIndex == 2) {
            system.debug('### got requested value !!');
        	return true;
        }
        else {
            return false;
        }
    }

}
