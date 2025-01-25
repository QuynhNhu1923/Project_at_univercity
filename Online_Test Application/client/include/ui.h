// client/include/ui.h
#ifndef UI_H
#define UI_H

#include "client.h"
#include "exam.h"
#include "practice.h"
#include <stdio.h>
#include <unistd.h>

void print_banner(void);
void print_main_menu(void);
void print_room_menu(int is_creator, int exam_completed);
void clear_screen(void);
void print_error(const char* message);
void print_success(const char* message);
void handle_main_menu(Client* client);
void handle_room_menu(Client* client);
void print_practice_room_menu(void);

#endif // UI_H