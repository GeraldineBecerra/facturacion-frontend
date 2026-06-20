import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
    selector: 'app-user-form',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './user-form.html',
    styleUrl: './user-form.scss'
})
export class UserForm {

    showPassword = false;

    user = {
        username: '',
        password: '',
        role: '',
        active: true
    };

    togglePassword() {
        this.showPassword = !this.showPassword;
    }

    saveUser() {
        console.log('User saved', this.user);
    }

}