import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

/** Campos alineados con `EmpresaEntity` del backend (JSON típico en camelCase). */
export interface EmpresaFormModel {
    rutEmpresa: string;
    razonSocial: string;
    nombreFantasia: string;
    giro: string;
    direccion: string;
    ciudad: string;
    comuna: string;
    pais: string;
    telefono: string;
    sitioWeb: string;
    emailPrincipal: string;
    emailContabilidad: string;
    activo: boolean;
    rutRepresentante: string;
    nombreRepresentante: string;
    telefonoRepresentante: string;
}

@Component({
    selector: 'app-company-form',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './company-form.html',
    styleUrl: './company-form.scss',
})
export class CompanyForm {
    empresa: EmpresaFormModel = {
        rutEmpresa: '',
        razonSocial: '',
        nombreFantasia: '',
        giro: '',
        direccion: '',
        ciudad: '',
        comuna: '',
        pais: 'Chile',
        telefono: '',
        sitioWeb: '',
        emailPrincipal: '',
        emailContabilidad: '',
        activo: true,
        rutRepresentante: '',
        nombreRepresentante: '',
        telefonoRepresentante: '',
    };

    constructor(private router: Router) {}

    cancelar() {
        this.router.navigate(['/companies']);
    }

    guardar() {
        const payload = { ...this.empresa };
        console.log('Empresa a enviar al backend', payload);
    }
}
