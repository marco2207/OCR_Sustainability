import { LightningElement,api,track } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent'
import { updateRecord } from 'lightning/uiRecordApi';
import createContentUrl from '@salesforce/apex/Sustainability_OCR_Ctrl.createContentUrl';
import analyseImageUrl from '@salesforce/apex/Sustainability_OCR_Ctrl.analyseImageUrl';

export default class OCRSustainabilityLWC extends LightningElement {
    @track contentId;
    @track error;
    @track pictureSrc="https://s3-us-west-1.amazonaws.com/sfdc-demo/image-placeholder.png";
    @api recordId;
    @api isUpdateRecord;
    @api fieldAPIName;   
    @api convertedText;
    
    get acceptedFormats() {
        return ['.jpg','.png','.jpeg'];
    }

    
    handleUploadFinished(event) {
        let uploadedFiles = event.detail.files;
        // eslint-disable-next-line no-console
        console.log("@@@ upload finished " + uploadedFiles.length);
        
        
        for(let i=0; i<uploadedFiles.length; i++) {
           // eslint-disable-next-line no-console
           console.log( uploadedFiles[i].name + ' - ' + uploadedFiles[i].documentId );
           this.contentId =  uploadedFiles[i].documentId;
            // eslint-disable-next-line no-console
       // console.log("content id -----  " +  this.contentId);
        }
        this.getContentUrl();
        console.log("@@@ content url got");

        this.text="Thank you!";
    }
    getContentUrl()
    {
        console.log("@@@ calling content method to get content url");
        createContentUrl(
            {
                contentDocumentId:this.contentId
            }
        )
        .then(result => {
            console.log("@@@ result----"+result);
            console.log("image url -----"+result);
            this.pictureSrc = result;
            this.analyzeImage(result);

        })
        .catch(error => {
            console.log("@@@ error creating content url");
            this.error = error;
        });

    }
    analyzeImage(picUrl)
    {
        console.log("@@@ calling Analyze image");

        analyseImageUrl(
            {
                url: picUrl

            }
        )
        .then(result => {
           // console.log(result.data.probabilities);
            let conts=result;
            console.log("@@@ result from Analyze image");
            console.log(result);

            this.convertedText=result;
            console.log(this.convertedText);
            if(this.isUpdateRecord==true)
            {
            const fields = {};
            fields['Id'] = this.recordId;
            fields[this.fieldAPIName] = this.convertedText;
           

            const recordInput = { fields };
            updateRecord(recordInput)
            .then(() => {
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Success',
                        message: 'Successfully Updated!',
                        variant: 'success'
                    })
                );
                // Display fresh data in the form
                return refreshApex(this.contact);
            })
            .catch(error => {
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Error creating record',
                        message: error.body.message,
                        variant: 'error'
                    })
                );
            });
        }
        })
        .catch(error => {
            console.log("@@@ error in analyze image ....");

            this.error = error;
        });
    }
}
