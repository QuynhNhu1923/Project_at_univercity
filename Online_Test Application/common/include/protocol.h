// common/include/protocol.h
#ifndef PROTOCOL_H
#define PROTOCOL_H

// Authentication commands 
#define CMD_REGISTER "REGISTER"
#define CMD_LOGIN "LOGIN"
#define CMD_LOGOUT "LOGOUT"

// Room management commands 
#define CMD_CREATE_ROOM "CREATE_ROOM"
#define CMD_JOIN_ROOM "JOIN_ROOM"
#define CMD_LEAVE_ROOM "LEAVE_ROOM"
#define CMD_LIST_ROOMS "LIST_ROOMS"
#define CMD_DELETE_ROOM "DELETE_ROOM"
#define CMD_START_EXAM "START_EXAM"

// Exam commands 
#define CMD_SUBMIT_ANSWER "SUBMIT_ANSWER"
#define CMD_SUBMIT_EARLY "SUBMIT_EARLY"
#define CMD_GET_SCORE "GET_SCORE"
#define CMD_GET_RESULTS "GET_RESULTS"
#define CMD_REVIEW_QUESTION "REVIEW"         
#define CMD_CHANGE_EXAM_ANSWER "CHANGE"      
#define CMD_GET_EXAM_TIME "TIME"           
#define CMD_LIST_ANSWERS "LIST_ANSWERS"     
#define CMD_SET_EXAM_FORMAT "SET_EXAM_FORMAT"  

// Practice mode commands 
#define CMD_START_PRACTICE "START_PRACTICE"
#define CMD_LEAVE_PRACTICE "LEAVE_PRACTICE"
#define CMD_GET_SUBJECTS "GET_SUBJECTS"
#define CMD_SUBMIT_PRACTICE_ANSWER "SUBMIT_PRACTICE_ANSWER"
#define CMD_GET_TIME_LEFT "TIME"
#define CMD_SUBMIT_PRACTICE "SUBMIT"
#define CMD_CHANGE_ANSWER "CHANGE_ANSWER"

// Server responses 
#define RESP_SUCCESS "SUCCESS"
#define RESP_AUTH_FAILED "AUTH_FAILED"
#define RESP_NOT_FOUND "NOT_FOUND"
#define RESP_ERROR "ERROR"
#define RESP_ROOM_CREATED "ROOM_CREATED"
#define RESP_ROOM_JOINED "JOINED_ROOM"
#define RESP_ROOM_LEFT "LEFT_ROOM"
#define RESP_ROOM_DELETED "ROOM_DELETED"
#define RESP_EXAM_STARTED "EXAM_STARTED"
#define RESP_EXAM_COMPLETED "EXAM_COMPLETED"
#define RESP_PRACTICE_ACCEPT "PRACTICE_ACCEPT"
#define RESP_TIMEOUT "TIMEOUT"
#define RESP_SUBJECTS "SUBJECTS"
#define RESP_ANSWER_CHANGED "ANSWER_CHANGED"    
#define RESP_QUESTION_LIST "QUESTION_LIST"      
#define RESP_EXAM_FORMAT_SET "FORMAT_ACCEPTED"  

// Response codes 
#define RESP_CODE_SUCCESS 200
#define RESP_CODE_AUTH_FAILED 401
#define RESP_CODE_NOT_FOUND 404
#define RESP_CODE_ERROR 500
#define RESP_CODE_ROOM_FULL 503
#define RESP_CODE_INVALID_REQUEST 400
#define RESP_CODE_FORBIDDEN 403

// Format errors 
#define ERROR_FORMAT "ERROR_FORMAT"
#define ERROR_NO_QUESTIONS "NO_QUESTIONS_AVAILABLE"
#define ERROR_TIME_EXPIRED "TIME_EXPIRED"
#define ERROR_INVALID_ANSWER "INVALID_ANSWER"
#define ERROR_NOT_AUTHORIZED "NOT_AUTHORIZED"
#define ERROR_ROOM_EXISTS "ROOM_EXISTS"
#define ERROR_USER_EXISTS "USER_EXISTS"
#define ERROR_INVALID_CREDENTIALS "INVALID_CREDENTIALS"
#define ERROR_QUESTION_NOT_FOUND "QUESTION_NOT_FOUND"  
#define ERROR_CANNOT_CHANGE "CANNOT_CHANGE_ANSWER"     
#define ERROR_INVALID_QUESTION "INVALID_QUESTION_NUMBER" 

// Question format 
#define MAX_QUESTION_LENGTH 200
#define MAX_OPTION_LENGTH 100
#define MAX_SUBJECT_LENGTH 50

// Response format prefixes 
#define PREFIX_SCORE "SCORE:"
#define PREFIX_TIME_LEFT "TIME_LEFT:"
#define PREFIX_QUESTION "Question"
#define PREFIX_SUBJECTS "SUBJECTS|"
#define PREFIX_ANSWER_LIST "ANSWERS:"       
#define PREFIX_QUESTION_REVIEW "REVIEW:"    
#define PREFIX_CHANGE_RESULT "CHANGED:"     

#endif // PROTOCOL_H