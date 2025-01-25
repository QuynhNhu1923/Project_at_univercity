package source;


import javax.swing.*;

import source.GUI.MainMenu;

public class DataStructureDemo {

    public static void main(String[] args) {
        SwingUtilities.invokeLater(() -> new MainMenu().setVisible(true));
    }
}