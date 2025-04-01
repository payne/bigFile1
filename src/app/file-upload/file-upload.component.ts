import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

@Component({
  selector: 'app-file-upload',
  standalone: true,
  imports: [
    CommonModule, 
    HttpClientModule, 
    MatButtonModule, 
    MatCardModule, 
    MatIconModule, 
    MatProgressBarModule,
    MatSnackBarModule
  ],
  templateUrl: './file-upload.component.html',
  styleUrls: ['./file-upload.component.scss']
})
export class FileUploadComponent {
  private http = inject(HttpClient);
  private snackBar = inject(MatSnackBar);
  
  fileName = '';
  isUploading = false;
  uploadProgress = 0;
  readonly MAX_FILE_SIZE = 10 * 1024; // 10KB in bytes

  onFileSelected(event: Event) {
    const fileInput = event.target as HTMLInputElement;
    if (!fileInput.files || fileInput.files.length === 0) {
      return;
    }
    
    const file = fileInput.files[0];
    this.fileName = file.name;
    
    // Check if file is JSON
    if (file.type !== 'application/json' && !file.name.endsWith('.json')) {
      this.showError('Only JSON files are allowed');
      this.resetFileInput(fileInput);
      return;
    }
    
    // Check file size
    if (file.size > this.MAX_FILE_SIZE) {
      this.showError(`File size exceeds maximum allowed size of ${this.MAX_FILE_SIZE / 1024}KB`);
      this.resetFileInput(fileInput);
      return;
    }
    
    this.uploadFile(file, fileInput);
  }
  
  private uploadFile(file: File, fileInput: HTMLInputElement) {
    this.isUploading = true;
    this.uploadProgress = 0;
    
    const formData = new FormData();
    formData.append('file', file);
    
    this.http.post('http://localhost:8080/fUpload', formData, {
      reportProgress: true,
      observe: 'events',
      responseType: 'json'
    }).subscribe({
      next: (event: any) => {
        if (event.type === 1) { // HttpEventType.UploadProgress
          if (event.total) {
            this.uploadProgress = Math.round(100 * event.loaded / event.total);
          }
        } else if (event.type === 4) { // HttpEventType.Response
          this.isUploading = false;
          this.showSuccess('File uploaded successfully');
          this.resetFileInput(fileInput);
        }
      },
      error: (error) => {
        this.isUploading = false;
        this.showError('Upload failed: ' + error.message);
        this.resetFileInput(fileInput);
      }
    });
  }
  
  private resetFileInput(fileInput: HTMLInputElement) {
    fileInput.value = '';
    this.fileName = '';
  }
  
  private showError(message: string) {
    this.snackBar.open(message, 'Close', {
      duration: 5000,
      panelClass: ['error-snackbar']
    });
  }
  
  private showSuccess(message: string) {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      panelClass: ['success-snackbar']
    });
  }
}