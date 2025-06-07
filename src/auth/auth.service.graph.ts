import { BadRequestException, Injectable, InternalServerErrorException, UnauthorizedException } from '@nestjs/common';
import { LoginAuthDto } from './dto/login-auth.dto';
import { AuthReponse } from './types/auth-response.type';
import { UsersService } from 'src/users/users.service';
import * as bcrypt from 'bcrypt';
import { RegisterAuthDto } from './dto/register-auth.dto';
import { User } from 'src/users/entities/user.entity';
import { JwtService } from '@nestjs/jwt';
@Injectable()
export class AuthServiceGraph {

    constructor(private readonly userService: UsersService,
        private readonly jwtService: JwtService,
    ) { }

    private getJwtToken(userId: string) {
        return this.jwtService.sign({ id: userId });
    }

    async login(loginInput: LoginAuthDto): Promise<AuthReponse> {

        const { email, password } = loginInput;
        const user = await this.userService.findByEmail(email);

        if (!user) throw new BadRequestException('User not found');

        if (!bcrypt.compareSync(password, user.password!)) {
            throw new BadRequestException('Email / Password do not match');
        }

        const token = this.getJwtToken(user.id);

        console.log(user);

        return {
            token,
            user
        }
    }

    async signup(signupInput: RegisterAuthDto): Promise<AuthReponse> {
        const { password, ...userData } = signupInput;

        try {
            const newUser = await this.userService.create({
                ...userData,
                password: bcrypt.hashSync(password, 10),
            });

            const token = this.getJwtToken(newUser.id);

            return { token, user: newUser }


        } catch (error) {
            throw new InternalServerErrorException('Error creating user');
        }

    }

    async validateUser(id: string): Promise<User> {
        const user = await this.userService.findById(id);
        if (!user) throw new BadRequestException(`user with id: ${id} not found`)

        if (!user.isActive) {
            throw new UnauthorizedException(`User is inactive, talk with an admin`);
        }
        if (!user) throw new BadRequestException('User not found');

        delete user.password;
        return user;
    }

}