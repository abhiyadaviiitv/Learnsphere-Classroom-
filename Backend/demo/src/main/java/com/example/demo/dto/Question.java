package com.example.demo.dto;

public class Question {
    private String text;
    private int points;
    private String ExpectedAnswer;
    public String getExpectedAnswer() {
        return ExpectedAnswer;
    }

    public void setExpectedAnswer(String expectedAnswer) {
        ExpectedAnswer = expectedAnswer;
    }

    public String getText() {
        return text;
    }

    public void setText(String text) {
        this.text = text;
    }

    public int getPoints() {
        return points;
    }

    public void setPoints(int points) {
        this.points = points;
    }
}
